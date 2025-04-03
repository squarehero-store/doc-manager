// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import {
    getFirestore,
    collection,
    getDocs,
    getDoc,
    doc,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBHbWQTlPsy46Q3aOznNI9By5G-2QU3jX8",
    authDomain: "portfolio-summary-block.firebaseapp.com",
    projectId: "portfolio-summary-block",
    storageBucket: "portfolio-summary-block.appspot.com",
    messagingSenderId: "654906694260",
    appId: "1:654906694260:web:a235c68efd984ea390cf21"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements
const elements = {
    // Lists and containers
    pluginList: document.getElementById('plugin-list'),
    pluginsContainer: document.getElementById('plugins-list-container'),
    contentContainer: document.getElementById('content-container'),
    helpDocsContainer: document.getElementById('help-docs-container'),
    initialState: document.getElementById('initial-state'),
    pluginContent: document.getElementById('plugin-content'),

    // Plugin details
    selectedPluginTitle: document.getElementById('selected-plugin-title'),
    selectedPluginDescription: document.getElementById('selected-plugin-description'),

    // New Doc Button
    newDocButton: document.getElementById('new-doc-button'),

    // Document Panel
    docPanel: document.getElementById('doc-panel'),
    panelTitle: document.getElementById('panel-title'),
    docExcerpt: document.getElementById('doc-excerpt'),
    panelClose: document.getElementById('panel-close'),
    viewMode: document.getElementById('view-mode'),
    editMode: document.getElementById('edit-mode'),

    // View mode elements
    viewDocCategory: document.getElementById('view-doc-category'),
    viewDocContent: document.getElementById('view-doc-content'),
    closeViewButton: document.getElementById('close-view-button'),
    editDocButton: document.getElementById('edit-doc-button'),

    // Edit mode elements
    docForm: document.getElementById('doc-form'),
    docTitle: document.getElementById('doc-title'),
    docContent: document.getElementById('doc-content'),
    docCategory: document.getElementById('doc-category'),

    // Panel notification bar
    notificationBar: document.getElementById('panel-notification'),
    notificationText: document.getElementById('notification-text'),
    discardChangesButton: document.getElementById('discard-changes-button'),
    saveDocButton: document.getElementById('save-doc-button'),

    // Overlay
    overlay: document.getElementById('overlay'),

    // Delete Modal
    deleteModal: document.getElementById('delete-modal'),
    deleteModalClose: document.getElementById('delete-modal-close'),
    cancelDeleteButton: document.getElementById('cancel-delete-button'),
    confirmDeleteButton: document.getElementById('confirm-delete-button'),

    // Toast
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message')
};

// State with empty plugins array initially
let state = {
    plugins: [],
    selectedPlugin: null,
    helpDocs: [],
    currentDoc: null,
    isEditing: false,
    hasUnsavedChanges: false
};

// Make state accessible globally
window.state = state;

// Initialize the application
async function init() {
    try {
        // Load plugins from JSON file
        await loadPlugins();
        
        // Render plugins list
        renderPlugins();

        // Add event listeners
        addEventListeners();

        // Show toast to indicate app is ready
        showToast('Help Documentation Manager loaded successfully', 'success');
    } catch (error) {
        console.error('Error initializing app:', error);
        showToast('Error loading plugins: ' + error.message, 'error');
    }
}

// Load plugins from JSON file
async function loadPlugins() {
    try {
        const response = await fetch('/plugins.json');
        
        if (!response.ok) {
            throw new Error(`Failed to load plugins.json (${response.status}: ${response.statusText})`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data.plugins)) {
            state.plugins = data.plugins;
            console.log('Plugins loaded:', state.plugins);
        } else {
            throw new Error('Invalid plugins.json format');
        }
    } catch (error) {
        console.error('Error loading plugins:', error);
        throw error;
    }
}

// Render plugins list
function renderPlugins() {
    elements.pluginList.innerHTML = '';

    state.plugins.forEach(plugin => {
        const li = document.createElement('li');
        li.className = 'plugin-item';
        li.dataset.pluginId = plugin.id;

        if (state.selectedPlugin && state.selectedPlugin.id === plugin.id) {
            li.classList.add('active');
        }

        li.innerHTML = `
            <a href="#" class="plugin-link">
                <span class="plugin-name">${plugin.name}</span>
                <span class="doc-count" id="doc-count-${plugin.id}">0</span>
            </a>
        `;

        li.addEventListener('click', () => selectPlugin(plugin));
        elements.pluginList.appendChild(li);

        // Update the document count for each plugin
        updateDocCount(plugin.id);
    });
}

// Update document count for a plugin
async function updateDocCount(pluginId) {
    try {
        const querySnapshot = await getDocs(collection(db, 'plugins', pluginId, 'helpDocs'));
        const count = querySnapshot.size;

        const docCountElement = document.getElementById(`doc-count-${pluginId}`);
        if (docCountElement) {
            docCountElement.textContent = count;
        }

        return count;
    } catch (error) {
        console.error('Error getting document count:', error);
        return 0;
    }
}

// Select a plugin
async function selectPlugin(plugin) {
    state.selectedPlugin = plugin;

    // Close panel if open
    closePanel();

    // Update UI
    elements.initialState.style.display = 'none';
    elements.pluginContent.style.display = 'block';
    elements.selectedPluginTitle.textContent = plugin.name;
    
    // Use the description from the JSON file
    elements.selectedPluginDescription.textContent = plugin.description || '';

    // Restore content column margin
    elements.contentContainer.classList.remove('panel-open');

    // Update active state in plugin list
    document.querySelectorAll('.plugin-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.pluginId === plugin.id) {
            item.classList.add('active');
        }
    });

    // Show loading state
    elements.helpDocsContainer.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading help documents...</div>
        </div>
    `;

    // Load help docs
    await loadHelpDocs(plugin.id);
}

// Load help docs for a plugin
async function loadHelpDocs(pluginId) {
    try {
        // Check if plugin document exists, if not create it
        const pluginDocRef = doc(db, 'plugins', pluginId);
        const pluginDoc = await getDoc(pluginDocRef);

        if (!pluginDoc.exists()) {
            // Create the plugin document
            await setDoc(pluginDocRef, {
                name: state.plugins.find(p => p.id === pluginId).name,
                updatedAt: new Date()
            });
        }

        // Get help docs
        const q = query(collection(db, 'plugins', pluginId, 'helpDocs'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        state.helpDocs = [];
        querySnapshot.forEach((doc) => {
            state.helpDocs.push({
                id: doc.id,
                ...doc.data()
            });
        });

        renderHelpDocs();

        // Update document count
        updateDocCount(pluginId);
    } catch (error) {
        console.error('Error loading help docs:', error);
        elements.helpDocsContainer.innerHTML = `
            <div class="alert alert-error">
                <div class="alert-icon">⚠️</div>
                <div>Error loading help documents: ${error.message}</div>
            </div>
        `;
    }
}

// Updated renderHelpDocs function to properly pass document data to editDocument
function renderHelpDocs() {
    if (state.helpDocs.length === 0) {
        elements.helpDocsContainer.innerHTML = `
            <div class="empty-state">
                <h3 class="empty-state-title">No Help Documents Yet</h3>
                <p class="empty-state-text">Create your first help document by clicking the "New Help Document" button above.</p>
            </div>
        `;
        return;
    }

    elements.helpDocsContainer.innerHTML = '';

    state.helpDocs.forEach(doc => {
        const card = document.createElement('div');
        card.className = 'help-doc-card';
        card.dataset.docId = doc.id;

        // Format date
        const date = doc.createdAt ? new Date(doc.createdAt.seconds * 1000) : new Date();
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        // Get category label
        const categoryLabel = getCategoryLabel(doc.category);

        // Prepare card HTML content
        let cardHTML = `
            <div class="help-doc-header">
                <h3 class="help-doc-title">${doc.title}</h3>
                <div class="help-doc-actions">
                    <button class="button button-outline edit-doc-btn" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
                        </svg>
                    </button>
                    <button class="button button-danger delete-doc-btn" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                            <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                        </svg>
                    </button>
                </div>
            </div>`;
            
        // Only add excerpt div if it exists
        if (doc.excerpt && doc.excerpt.trim() !== '') {
            cardHTML += `<div class="help-doc-excerpt">${doc.excerpt}</div>`;
        }
        
        cardHTML += `
            <div class="help-doc-meta">
                <span class="help-doc-category">${categoryLabel}</span>
                <span class="help-doc-created">Created: ${formattedDate}</span>
            </div>
        `;
        
        card.innerHTML = cardHTML;

        // Add event listeners
        card.addEventListener('click', (e) => {
            // Ignore clicks on buttons
            if (!e.target.closest('button')) {
                viewDocument(doc);
            }
        });

        // CRITICAL FIX: Make sure the entire document object (with ID) is passed to editDocument
        const editBtn = card.querySelector('.edit-doc-btn');
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log("Edit button clicked for document ID:", doc.id);
            
            // Make sure we're using the local editDocument function directly
            // and that we pass the complete document object
            editDocument(doc);
        });

        const deleteBtn = card.querySelector('.delete-doc-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openDeleteModal(doc);
        });

        elements.helpDocsContainer.appendChild(card);
    });
}

// Get category label from category ID
function getCategoryLabel(categoryId) {
    const categories = {
        'getting-started': 'Getting Started',
        'installation': 'Installation',
        'configuration': 'Configuration',
        'customization': 'Customization',
        'troubleshooting': 'Troubleshooting',
        'faq': 'FAQ'
    };

    return categories[categoryId] || 'Uncategorized';
}

// Open side panel
function openPanel() {
    const docPanel = document.getElementById('doc-panel');
    const overlay = document.getElementById('overlay');
    
    // Make sure these elements exist
    if (docPanel) docPanel.classList.add('visible');
    if (overlay) overlay.classList.add('visible');
    
    console.log("Panel classes:", docPanel.className); // Add this debug
}

// Update the closePanel function to not remove the panel-open class
function closePanel() {
    // Check if there are unsaved changes
    if (state.hasUnsavedChanges) {
        // Show notification instead of closing
        showPanelNotification();
        // Add shake animation
        elements.notificationBar.classList.add('shake');
        // Remove shake class after animation completes
        setTimeout(() => {
            elements.notificationBar.classList.remove('shake');
        }, 500);
        return;
    }

    // Destroy editor if it exists
    if (window.tinyEditor) {
        window.RichTextEditor.destroy();
    }

    elements.docPanel.classList.remove('visible');
    elements.overlay.classList.remove('visible');

    // Hide notification bar if visible
    hidePanelNotification();

    // Reset edit state
    state.isEditing = false;
    state.currentDoc = null;
    state.hasUnsavedChanges = false;
}

// Open new document panel
function openNewDocPanel() {
    state.isEditing = false;
    state.currentDoc = null;
    state.hasUnsavedChanges = false;

    // Reset form
    elements.docForm.reset();

    // Update panel title
    elements.panelTitle.textContent = 'New Help Document';

    // Show edit mode, hide view mode
    elements.viewMode.style.display = 'none';
    elements.editMode.style.display = 'block';

    // Hide notification bar
    hidePanelNotification();

    // Open panel
    openPanel();
}

// View document in side panel
function viewDocument(document) {
    // Set current document
    state.currentDoc = document;
    state.hasUnsavedChanges = false;

    // Update panel content
    elements.panelTitle.textContent = document.title;
    elements.viewDocCategory.textContent = getCategoryLabel(document.category);

    // Change from textContent to innerHTML
    elements.viewDocContent.innerHTML = document.content;

    // Show view mode, hide edit mode
    elements.viewMode.style.display = 'block';
    elements.editMode.style.display = 'none';

    // Hide notification bar
    hidePanelNotification();

    // Open panel
    openPanel();
}

// Fixed editDocument function
function editDocument(document) {
    console.log("Edit document called with:", document);
    console.log("Document ID:", document.id);
    
    // Make sure we're in editing mode and have a document with ID
    state.isEditing = true;
    
    // Create a deep copy of the document to avoid reference issues
    state.currentDoc = JSON.parse(JSON.stringify(document));
    
    state.hasUnsavedChanges = false;

    // Update form fields
    elements.docTitle.value = document.title || '';
    elements.docContent.value = document.content || '';
    elements.docCategory.value = document.category || 'getting-started';
    elements.docExcerpt.value = document.excerpt || ''; // Add excerpt field

    // Update panel title
    elements.panelTitle.textContent = 'Edit Help Document';

    // Show edit mode, hide view mode
    elements.viewMode.style.display = 'none';
    elements.editMode.style.display = 'block';

    // Hide notification bar
    hidePanelNotification();

    // Open panel
    openPanel();

    // Initialize rich text editor
    setTimeout(() => {
        if (window.RichTextEditor && typeof window.RichTextEditor.init === 'function') {
            window.RichTextEditor.init('#doc-content')
                .then(editor => {
                    window.RichTextEditor.setContent(document.content || '');
                    console.log("Editor initialized with content");
                })
                .catch(error => {
                    console.error('Error initializing rich text editor:', error);
                });
        }
    }, 50);
}

// Open delete confirmation modal
function openDeleteModal(document) {
    state.currentDoc = document;
    elements.deleteModal.classList.add('active');
}

// Show panel notification bar
function showPanelNotification(message = 'Unsaved changes') {
    elements.notificationBar.style.display = 'flex';
    elements.notificationText.textContent = message;
}

// Hide panel notification bar
function hidePanelNotification() {
    elements.notificationBar.style.display = 'none';
}

// Mark form as having unsaved changes
function markUnsavedChanges() {
    state.hasUnsavedChanges = true;
    showPanelNotification();
}

// Save document - fixed version
async function saveDocument() {
    console.log("Save document called");
    
    if (!elements.docForm.checkValidity()) {
        elements.docForm.reportValidity();
        return;
    }

    // Get form data
    const title = elements.docTitle.value.trim();
    const content = window.tinyEditor ? 
        window.RichTextEditor.getContent() : 
        elements.docContent.value.trim();
    const category = elements.docCategory.value;
    const excerpt = elements.docExcerpt.value.trim(); // Get excerpt value

    if (!title || !content) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    try {
        // Get the document ID from our state
        const isEditing = state.isEditing;
        const currentDoc = state.currentDoc;
        
        console.log("Save check:", { 
            isEditing, 
            docId: currentDoc?.id 
        });

        if (isEditing && currentDoc && currentDoc.id) {
            console.log("Updating document ID:", currentDoc.id);
            
            // Update existing document
            const docRef = doc(db, 'plugins', state.selectedPlugin.id, 'helpDocs', currentDoc.id);
            await updateDoc(docRef, {
                title,
                content,
                category,
                excerpt, // Add excerpt to update
                updatedAt: new Date()
            });

            showToast('Document updated successfully', 'success');
        } else {
            console.log("Creating new document");
            
            // Add new document
            await addDoc(collection(db, 'plugins', state.selectedPlugin.id, 'helpDocs'), {
                title,
                content,
                category,
                excerpt, // Add excerpt to new document
                createdAt: new Date(),
                updatedAt: new Date()
            });

            showToast('New document created successfully', 'success');
        }

        // Reset state and close panel
        state.hasUnsavedChanges = false;
        closePanel();
        
        // Reload help docs
        await loadHelpDocs(state.selectedPlugin.id);
    } catch (error) {
        console.error('Error saving document:', error);
        showToast('Error saving document: ' + error.message, 'error');
    }
}

// Delete document
async function deleteDocument() {
    if (!state.currentDoc) return;

    try {
        // Delete document
        const docRef = doc(db, 'plugins', state.selectedPlugin.id, 'helpDocs', state.currentDoc.id);
        await deleteDoc(docRef);

        // Close modal
        elements.deleteModal.classList.remove('active');

        // Show success message
        showToast('Document deleted successfully', 'success');

        // Close panel if open
        closePanel();

        // Reload help docs
        await loadHelpDocs(state.selectedPlugin.id);
    } catch (error) {
        console.error('Error deleting document:', error);
        showToast('Error deleting document: ' + error.message, 'error');
    }
}

// Discard changes
function discardChanges() {
    state.hasUnsavedChanges = false;
    closePanel();
}

// Show toast notification
function showToast(message, type = 'info') {
    // Set message
    elements.toastMessage.textContent = message;

    // Add appropriate class
    elements.toast.className = `toast toast-${type} show`;

    // Remove after 3 seconds
    setTimeout(() => {
        elements.toast.className = 'toast';
    }, 3000);
}

// Add the event listeners
function addEventListeners() {
    // New document button
    elements.newDocButton.addEventListener('click', openNewDocPanel);

    // Form input change events (for tracking unsaved changes)
    elements.docTitle.addEventListener('input', markUnsavedChanges);
    elements.docExcerpt.addEventListener('input', markUnsavedChanges);
    elements.docContent.addEventListener('input', markUnsavedChanges);
    elements.docCategory.addEventListener('change', markUnsavedChanges);

    // Panel close button
    elements.panelClose.addEventListener('click', closePanel);

    // View mode buttons
    elements.closeViewButton.addEventListener('click', closePanel);

    // Notification bar buttons
    elements.saveDocButton.addEventListener('click', saveDocument);
    elements.discardChangesButton.addEventListener('click', discardChanges);

    // Overlay click
    elements.overlay.addEventListener('click', closePanel);

    // Delete modal buttons
    elements.deleteModalClose.addEventListener('click', () => elements.deleteModal.classList.remove('active'));
    elements.cancelDeleteButton.addEventListener('click', () => elements.deleteModal.classList.remove('active'));
    elements.confirmDeleteButton.addEventListener('click', deleteDocument);

    // Escape key to close panels and modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (elements.deleteModal.classList.contains('active')) {
                elements.deleteModal.classList.remove('active');
            } else {
                closePanel();
            }
        }
    });

// Add edit button functionality
elements.editDocButton.addEventListener('click', () => {
    // If we have a current document being viewed
    if (state.currentDoc) {
        editDocument(state.currentDoc);
    }
});

// Add event listener for editDocButton
document.addEventListener('DOMContentLoaded', function() {
    const editDocButton = document.getElementById('edit-doc-button');
    if (editDocButton) {
        editDocButton.addEventListener('click', function() {
            if (state.currentDoc) {
                editDocument(state.currentDoc);
            }
        });
    }
});
}

// Make functions and data accessible globally for use from rich-text-editor.js
window.getCategoryLabel = getCategoryLabel;
window.showPanelNotification = showPanelNotification;
window.hidePanelNotification = hidePanelNotification;
window.markUnsavedChanges = markUnsavedChanges;
window.showToast = showToast;
window.loadHelpDocs = loadHelpDocs;
window.db = db;

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', init);