/**
 * SquareHero Help Documentation - Rich Text Editor Module
 * Uses TinyMCE for rich text editing capabilities with custom styles and components
 */

// RichTextEditor Module
const RichTextEditor = (function () {
    // Configuration
    const config = {
        tinymceScript: 'https://cdn.jsdelivr.net/npm/tinymce@6/tinymce.min.js',
        customStyles: `
            .hero-tip {
                background-color: #f3fcfe;
                border-left: 4px solid #0cc2ed;
                padding: 15px 20px;
                margin: 20px 0;
                border-radius: 4px;
            }
            
            .hero-warning {
                background-color: #fff8e1;
                border-left: 4px solid #F9A825;
                padding: 15px 20px;
                margin: 20px 0;
                border-radius: 4px;
            }
            
            .hero-code {
                background-color: #f5f5f5;
                font-family: monospace;
                padding: 15px;
                border-radius: 4px;
                white-space: pre;
                overflow-x: auto;
                margin: 20px 0;
            }
            
            .hero-note {
                background-color: #e8f5e9;
                border-left: 4px solid #4CAF50;
                padding: 15px 20px;
                margin: 20px 0;
                border-radius: 4px;
            }
        `
    };

    let editor = null;
    let changeCallback = null;

    /**
     * Initialize the editor
     * @param {string} selector - CSS selector for the textarea element
     * @param {object} options - Custom options for the editor
     * @returns {Promise} - Resolves when editor is initialized
     */
    function init(selector, options = {}) {
        return new Promise((resolve, reject) => {
            // Add custom styles to the document
            addCustomStyles();

            // Load TinyMCE if it's not already loaded
            if (!window.tinymce) {
                loadScript(config.tinymceScript)
                    .then(() => initEditor(selector, options, resolve))
                    .catch(error => {
                        console.error('Failed to load TinyMCE:', error);
                        reject(error);
                    });
            } else {
                initEditor(selector, options, resolve);
            }
        });
    }

    /**
     * Set a callback for when content changes
     * @param {Function} callback - Function to call when content changes
     */
    function setChangeCallback(callback) {
        changeCallback = callback;
    }

    /**
     * Initialize the TinyMCE editor
     * @param {string} selector - CSS selector for the textarea
     * @param {object} options - Custom options for the editor
     * @param {function} resolve - Promise resolve function
     */
    function initEditor(selector, options, resolve) {
        // Default editor options
        const defaultOptions = {
            selector: selector,
            height: 400,
            menubar: false,
            plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor',
                'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'help', 'wordcount'
            ],
            toolbar: 'undo redo | styles | bold italic | alignleft aligncenter alignright alignjustify | ' +
                'bullist numlist outdent indent | link | customTip customWarning customNote customCode customImageUrl | help',
            setup: function (ed) {
                // Store the editor instance
                window.tinyEditor = ed;
                editor = ed;

                // Add custom buttons
                addCustomButtons(ed);

                // Add content change handler
                ed.on('change', function () {
                    // Only trigger change callback if it exists
                    if (typeof changeCallback === 'function') {
                        changeCallback();
                    } else if (window.notifyContentChanged) {
                        // Fallback to global function if it exists
                        window.notifyContentChanged();
                    }
                });

                // Add custom styles to the styles dropdown
                ed.ui.registry.addMenuButton('styles', {
                    text: 'Styles',
                    fetch: function (callback) {
                        const items = [
                            {
                                type: 'menuitem',
                                text: 'Paragraph',
                                onAction: function () {
                                    ed.execCommand('formatBlock', false, 'p');
                                }
                            },
                            {
                                type: 'menuitem',
                                text: 'Heading 1',
                                onAction: function () {
                                    ed.execCommand('formatBlock', false, 'h1');
                                }
                            },
                            {
                                type: 'menuitem',
                                text: 'Heading 2',
                                onAction: function () {
                                    ed.execCommand('formatBlock', false, 'h2');
                                }
                            },
                            {
                                type: 'menuitem',
                                text: 'Heading 3',
                                onAction: function () {
                                    ed.execCommand('formatBlock', false, 'h3');
                                }
                            },
                            {
                                type: 'menuitem',
                                text: 'Heading 4',
                                onAction: function () {
                                    ed.execCommand('formatBlock', false, 'h4');
                                }
                            },
                            {
                                type: 'menuitem',
                                text: 'Pre',
                                onAction: function () {
                                    ed.execCommand('formatBlock', false, 'pre');
                                }
                            }
                        ];
                        callback(items);
                    }
                });

                // Editor initialized callback
                ed.on('init', function (e) {
                    resolve(ed);
                });
            },
            content_style: 'body { font-family: Roboto Condensed, sans-serif; font-size: 16px; }' +
                'h1 { font-size: 24px; font-weight: bold; margin-top: 20px; margin-bottom: 10px; }' +
                'h2 { font-size: 20px; font-weight: bold; margin-top: 18px; margin-bottom: 9px; }' +
                'h3 { font-size: 18px; font-weight: bold; margin-top: 16px; margin-bottom: 8px; }' +
                'h4 { font-size: 16px; font-weight: bold; margin-top: 14px; margin-bottom: 7px; }' +
                'p { margin-top: 0; margin-bottom: 10px; }' +
                'ul, ol { margin-top: 10px; margin-bottom: 10px; }' +
                'a { color: #0cc2ed; }' +
                '.hero-tip { background-color: #f3fcfe; border-left: 4px solid #0cc2ed; padding: 15px 20px; margin: 20px 0; border-radius: 4px; }' +
                '.hero-warning { background-color: #fff8e1; border-left: 4px solid #F9A825; padding: 15px 20px; margin: 20px 0; border-radius: 4px; }' +
                '.hero-code { background-color: #f5f5f5; font-family: monospace; padding: 15px; border-radius: 4px; white-space: pre; overflow-x: auto; margin: 20px 0; }' +
                '.hero-note { background-color: #e8f5e9; border-left: 4px solid #4CAF50; padding: 15px 20px; margin: 20px 0; border-radius: 4px; }'
        };

        // Enhance the options for better block handling
        const enhancedOptions = enhanceEditorConfig(defaultOptions);

        // Merge with custom options
        const mergedOptions = { ...enhancedOptions, ...options };

        // Initialize TinyMCE
        tinymce.init(mergedOptions);
    }

    /**
     * Add custom buttons to the editor
     * @param {object} editor - TinyMCE editor instance
     */
    function addCustomButtons(editor) {
        // Tip button
        editor.ui.registry.addButton('customTip', {
            text: 'Tip',
            tooltip: 'Insert a tip box',
            onAction: function () {
                const html = `<div class="hero-tip">
                    <h4>Tip</h4>
                    <p>Your helpful tip goes here.</p>
                </div><p>&nbsp;</p>`;
                editor.insertContent(html);
            }
        });

        // Warning button
        editor.ui.registry.addButton('customWarning', {
            text: 'Warning',
            tooltip: 'Insert a warning box',
            onAction: function () {
                const html = `<div class="hero-warning">
                    <h4>Warning</h4>
                    <p>Your warning message goes here.</p>
                </div><p>&nbsp;</p>`;
                editor.insertContent(html);
            }
        });

        // Note button
        editor.ui.registry.addButton('customNote', {
            text: 'Note',
            tooltip: 'Insert a note',
            onAction: function () {
                const html = `<div class="hero-note">
                    <h4>Note</h4>
                    <p>Your note goes here.</p>
                </div><p>&nbsp;</p>`;
                editor.insertContent(html);
            }
        });

        // Code block button
        editor.ui.registry.addButton('customCode', {
            text: 'Code',
            tooltip: 'Insert a code block',
            onAction: function () {
                const html = `<div class="hero-code">// Your code here</div><p>&nbsp;</p>`;
                editor.insertContent(html);

                // Focus on the empty paragraph
                const focus = editor.selection.getNode();
                const emptyParagraph = focus.nextSibling;
                if (emptyParagraph && emptyParagraph.nodeName === 'P') {
                    editor.selection.setCursorLocation(emptyParagraph, 0);
                }
            }
        });
        
        // Image URL button
        editor.ui.registry.addButton('customImageUrl', {
            text: 'Image',
            tooltip: 'Insert image from URL',
            onAction: function () {
                // Open a dialog to input image URL
                editor.windowManager.open({
                    title: 'Insert Image',
                    body: {
                        type: 'panel',
                        items: [
                            {
                                type: 'input',
                                name: 'imageUrl',
                                label: 'Image URL',
                                placeholder: 'https://example.com/image.jpg'
                            },
                            {
                                type: 'input',
                                name: 'altText',
                                label: 'Alternative Text (Optional)',
                                placeholder: 'Description of the image'
                            }
                        ]
                    },
                    buttons: [
                        {
                            type: 'cancel',
                            text: 'Cancel'
                        },
                        {
                            type: 'submit',
                            text: 'Insert',
                            primary: true
                        }
                    ],
                    onSubmit: function (api) {
                        const data = api.getData();
                        const imageUrl = data.imageUrl.trim();
                        const altText = data.altText ? data.altText.trim() : '';

                        if (imageUrl) {
                            // Insert image with container and optional alt text
                            const html = `
                                <div class="hero-image" style="margin: 20px 0; text-align: center;">
                                    <img src="${imageUrl}" alt="${altText}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" />
                                    ${altText ? `<p class="image-caption" style="margin-top: 10px; color: #666;">${altText}</p>` : ''}
                                </div>
                                <p>&nbsp;</p>
                            `;
                            editor.insertContent(html);

                            // Focus on the empty paragraph
                            const focus = editor.selection.getNode();
                            const emptyParagraph = focus.nextSibling;
                            if (emptyParagraph && emptyParagraph.nodeName === 'P') {
                                editor.selection.setCursorLocation(emptyParagraph, 0);
                            }
                        }

                        api.close();
                    }
                });
            }
        });
    }

    // Add additional editor configuration to handle block elements better
    function enhanceEditorConfig(defaultOptions) {
        // Add these settings to improve block handling
        const enhancedOptions = {
            ...defaultOptions,
            // Ensure correct element wrapping behavior
            forced_root_block: 'p',
            // Define custom elements that should be treated as blocks
            custom_elements: 'div[class=hero-tip],div[class=hero-warning],div[class=hero-note],div[class=hero-code]',
            // Allow div elements in the editor
            extended_valid_elements: 'div[*],code,pre',
            // Handle enter key in a more intuitive way
            end_container_on_empty_block: true,
            // Add a custom handler for the Enter key to handle blocks better
            setup: function (editor) {
                // Keep the original setup function
                if (defaultOptions.setup) {
                    defaultOptions.setup(editor);
                }

                // Add handler for double-enter after blocks
                editor.on('keydown', function (e) {
                    if (e.keyCode === 13) { // Enter key
                        const node = editor.selection.getNode();
                        const isCustomBlock = node.classList &&
                            (node.classList.contains('hero-tip') ||
                                node.classList.contains('hero-warning') ||
                                node.classList.contains('hero-note') ||
                                node.classList.contains('hero-code'));

                        if (isCustomBlock || node.closest('.hero-tip, .hero-warning, .hero-note, .hero-code')) {
                            // Insert paragraph after the block
                            const blockElement = isCustomBlock ? node : node.closest('.hero-tip, .hero-warning, .hero-note, .hero-code');
                            const newParagraph = editor.dom.create('p', {}, '<br data-mce-bogus="1">');
                            editor.dom.insertAfter(newParagraph, blockElement);
                            editor.selection.setCursorLocation(newParagraph, 0);
                            e.preventDefault();
                        }
                    }
                });
            }
        };

        return enhancedOptions;
    }

    /**
     * Add custom styles to the document
     */
    function addCustomStyles() {
        if (document.getElementById('hero-custom-styles')) {
            return;
        }

        const styleEl = document.createElement('style');
        styleEl.id = 'hero-custom-styles';
        styleEl.textContent = config.customStyles;
        document.head.appendChild(styleEl);
    }

    /**
     * Load a script asynchronously
     * @param {string} src - Script source URL
     * @returns {Promise} - Resolves when script is loaded
     */
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            document.head.appendChild(script);
        });
    }

    /**
     * Get content from the editor
     * @returns {string} - HTML content
     */
    function getContent() {
        return window.tinyEditor ? window.tinyEditor.getContent() : '';
    }

    /**
     * Set content in the editor
     * @param {string} content - HTML content
     */
    function setContent(content) {
        if (window.tinyEditor) {
            window.tinyEditor.setContent(content || '');
        }
    }

    /**
     * Check if the editor is empty
     * @returns {boolean}
     */
    function isEmpty() {
        const content = getContent();
        return !content || content === '<p></p>' || content === '';
    }

    /**
     * Destroy the editor instance
     */
    function destroy() {
        if (window.tinyEditor) {
            window.tinyEditor.destroy();
            window.tinyEditor = null;
        }
    }

    // Public API
    return {
        init,
        getContent,
        setContent,
        isEmpty,
        destroy,
        setChangeCallback
    };
})();

// Create a global function for notifying about content changes
window.notifyContentChanged = function () {
    if (typeof window.markUnsavedChanges === 'function') {
        window.markUnsavedChanges();
    } else {
        console.log('Content changed, but no handler is available');
    }
};

// Initialize the editor when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Helper function to set up the editor
    const setupEditor = function () {
        // Check if we're in edit mode and the textarea exists
        const docContentTextarea = document.getElementById('doc-content');
        if (docContentTextarea) {
            // Only initialize if we're in edit mode
            if (document.getElementById('edit-mode') &&
                document.getElementById('edit-mode').style.display !== 'none') {
                RichTextEditor.init('#doc-content')
                    .then((editor) => {
                        console.log('Rich text editor initialized');

                        // Set the change callback to trigger markUnsavedChanges
                        RichTextEditor.setChangeCallback(function () {
                            if (typeof window.markUnsavedChanges === 'function') {
                                window.markUnsavedChanges();
                            }
                        });
                    })
                    .catch(error => {
                        console.error('Error initializing rich text editor:', error);
                    });
            }
        }
    };

    // Check for the edit button click to initialize the editor
    const editDocButton = document.getElementById('edit-doc-button');
    if (editDocButton) {
        editDocButton.addEventListener('click', function () {
            // Give a moment for the edit mode to be displayed
            setTimeout(setupEditor, 50);
        });
    }

    // Check for the new doc button click to initialize the editor
    const newDocButton = document.getElementById('new-doc-button');
    if (newDocButton) {
        newDocButton.addEventListener('click', function () {
            // Give a moment for the edit mode to be displayed
            setTimeout(setupEditor, 50);
        });
    }

    // Add event listener for empty-new-doc-button if it exists
    document.addEventListener('click', function (event) {
        if (event.target.id === 'empty-new-doc-button' || event.target.closest('#empty-new-doc-button')) {
            // Give a moment for the edit mode to be displayed
            setTimeout(setupEditor, 50);
        }
    });
});

// Add this function to create a unique title with document ID
function createDocumentTitle(title, docId) {
    // For new documents with no ID yet
    if (!docId) {
        return title;
    }
    
    // For existing documents, append a short ID
    const shortId = docId.substring(0, 8);
    return `${title} [${shortId}]`;
}

// Make RichTextEditor available globally
window.RichTextEditor = RichTextEditor;