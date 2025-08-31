// Global state
let files = []
const completedBuckets = []
let isUploading = false
let copiedUrl = null

// DOM elements
const bucketNameInput = document.getElementById("bucket-name")
const bucketError = document.getElementById("bucket-error")
const uploadArea = document.getElementById("upload-area")
const fileInput = document.getElementById("file-input")
const uploadIconContainer = document.getElementById("upload-icon-container")
const uploadIcon = document.getElementById("upload-icon")
const uploadTitle = document.getElementById("upload-title")
const uploadDescription = document.getElementById("upload-description")
const bucketInfo = document.getElementById("bucket-info")
const bucketDisplay = document.getElementById("bucket-display")
const filePreviewSection = document.getElementById("file-preview-section")
const actionButtons = document.getElementById("action-buttons")
const clearBtn = document.getElementById("clear-btn")
const uploadBtn = document.getElementById("upload-btn")
const bucketAccessSection = document.getElementById("bucket-access-section")
const completedBucketsContainer = document.getElementById("completed-buckets")

// Initialize Lucide icons
const lucide = window.lucide // Declare the lucide variable
lucide.createIcons()

// Utility functions
function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

function formatFileSize(bytes) {
  return (bytes / 1024 / 1024).toFixed(2)
}

function validateBucketName(name) {
  const errorText = bucketError.querySelector(".error-text")

  if (!name.trim()) {
    showError("Bucket name is required")
    return false
  }
  if (name.length < 3) {
    showError("Bucket name must be at least 3 characters")
    return false
  }
  if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
    showError("Bucket name can only contain letters, numbers, hyphens, and underscores")
    return false
  }

  hideError()
  return true
}

function showError(message) {
  const errorText = bucketError.querySelector(".error-text")
  errorText.textContent = message
  bucketError.style.display = "flex"
  bucketNameInput.classList.add("error")
}

function hideError() {
  bucketError.style.display = "none"
  bucketNameInput.classList.remove("error")
}

function updateUploadAreaState() {
  const bucketName = bucketNameInput.value.trim()
  const isValid = validateBucketName(bucketName)

  if (isValid && bucketName) {
    // Enable upload area
    uploadArea.classList.remove("disabled")
    uploadArea.classList.add("enabled")
    uploadIconContainer.classList.remove("disabled")
    uploadIcon.classList.remove("disabled")
    fileInput.disabled = false

    // Update text
    uploadTitle.textContent = "Drop your images here"
    uploadDescription.innerHTML =
      'or <span style="color: var(--primary); font-weight: 500;">click to browse</span> your files'
    bucketInfo.style.display = "block"
    bucketDisplay.textContent = bucketName
  } else {
    // Disable upload area
    uploadArea.classList.add("disabled")
    uploadArea.classList.remove("enabled")
    uploadIconContainer.classList.add("disabled")
    uploadIcon.classList.add("disabled")
    fileInput.disabled = true

    // Update text
    uploadTitle.textContent = "Create a bucket first"
    uploadDescription.textContent = "Enter a valid bucket name above to start uploading images"
    bucketInfo.style.display = "none"
  }
}

function processFiles(newFiles) {
  const bucketName = bucketNameInput.value.trim()

  const uploadedFiles = Array.from(newFiles).map((file) => ({
    id: generateId(),
    file: file,
    preview: URL.createObjectURL(file),
    status: "uploading",
    bucketName: bucketName,
  }))

  files.push(...uploadedFiles)
  renderFilePreview()

  // Simulate upload process
  uploadedFiles.forEach((uploadedFile) => {
    setTimeout(
      () => {
        const fileIndex = files.findIndex((f) => f.id === uploadedFile.id)
        if (fileIndex !== -1) {
          files[fileIndex].status = Math.random() > 0.1 ? "success" : "error"
          renderFilePreview()
        }
      },
      Math.random() * 2000 + 1000,
    )
  })
}

function removeFile(id) {
  const fileIndex = files.findIndex((f) => f.id === id)
  if (fileIndex !== -1) {
    URL.revokeObjectURL(files[fileIndex].preview)
    files.splice(fileIndex, 1)
    renderFilePreview()
  }
}

function renderFilePreview() {
  if (files.length === 0) {
    filePreviewSection.style.display = "none"
    actionButtons.style.display = "none"
    return
  }

  filePreviewSection.style.display = "block"
  actionButtons.style.display = "flex"

  // Group files by bucket
  const filesByBucket = files.reduce((acc, file) => {
    if (!acc[file.bucketName]) {
      acc[file.bucketName] = []
    }
    acc[file.bucketName].push(file)
    return acc
  }, {})

  let html = ""
  Object.entries(filesByBucket).forEach(([bucket, bucketFiles]) => {
    html += `
            <div class="card">
                <div class="card-content">
                    <div class="section-header">
                        <i data-lucide="folder" class="section-icon"></i>
                        <h3>Bucket: <span style="font-family: 'Courier New', monospace; color: var(--accent);">${bucket}</span></h3>
                        <span style="font-size: 0.875rem; color: var(--muted-foreground);">(${bucketFiles.length} files)</span>
                    </div>
                    <div class="file-grid">
                        ${bucketFiles
                          .map(
                            (file) => `
                            <div class="file-item">
                                <div class="file-preview">
                                    <img src="${file.preview}" alt="${file.file.name}">
                                </div>
                                <div class="file-overlay">
                                    <button class="btn btn-destructive btn-sm" onclick="removeFile('${file.id}')">
                                        <i data-lucide="x"></i>
                                    </button>
                                </div>
                                <div class="file-status ${file.status}">
                                    ${
                                      file.status === "uploading"
                                        ? '<div class="spinner"></div>'
                                        : file.status === "success"
                                          ? '<i data-lucide="check"></i>'
                                          : '<i data-lucide="alert-circle"></i>'
                                    }
                                </div>
                                <div class="file-info">
                                    <div class="file-name">${file.file.name}</div>
                                    <div class="file-size">${formatFileSize(file.file.size)} MB</div>
                                </div>
                            </div>
                        `,
                          )
                          .join("")}
                    </div>
                </div>
            </div>
        `
  })

  filePreviewSection.innerHTML = html
  lucide.createIcons()
}

 async function handleUpload() {
  isUploading = true
  const btnText = uploadBtn.querySelector(".btn-text")
  const spinner = uploadBtn.querySelector(".spinner")

  btnText.textContent = "Uploading..."
  spinner.style.display = "block"
  uploadBtn.disabled = true

  const successfulFiles = []

  for (const file of files) {
    const formData = new FormData()
    formData.append('bucket', file.bucketName)
    formData.append('image', file.file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
        })


      const result = await res.json()

      if (result.success) {
        file.status = "success"
        file.url = result.url
        successfulFiles.push(file)
      } else {
        file.status = "error"
      }
    } catch (err) {
      file.status = "error"
      console.error('Upload failed:', err)
    }

    renderFilePreview()
  }

  if (successfulFiles.length > 0) {
    const newBucket = {
      name: bucketNameInput.value.trim(),
      files: successfulFiles,
      createdAt: new Date()
    }
    completedBuckets.unshift(newBucket)
    renderBucketAccess()
  }

  // Reset
  files.forEach(f => URL.revokeObjectURL(f.preview))
  files = []
  isUploading = false

  btnText.textContent = "Upload Files"
  spinner.style.display = "none"
  uploadBtn.disabled = false

  bucketNameInput.value = ""
  renderFilePreview()
  updateUploadAreaState()
}


function clearAllFiles() {
  files.forEach((file) => URL.revokeObjectURL(file.preview))
  files = []
  renderFilePreview()
}

async function copyToClipboard(url) {
  try {
    await navigator.clipboard.writeText(url)
    copiedUrl = url
    renderBucketAccess()
    setTimeout(() => {
      copiedUrl = null
      renderBucketAccess()
    }, 2000)
  } catch (err) {
    console.error("Failed to copy URL:", err)
  }
}

function renderBucketAccess() {
  if (completedBuckets.length === 0) {
    bucketAccessSection.style.display = "none"
    return
  }

  bucketAccessSection.style.display = "block"

  let html = ""
  completedBuckets.forEach((bucket, index) => {
    html += `
            <div class="bucket-item">
                <div class="bucket-header">
                    <div class="bucket-title">
                        <i data-lucide="folder" style="width: 1.25rem; height: 1.25rem; color: var(--accent);"></i>
                        <h3><span class="bucket-name">${bucket.name}</span></h3>
                        <span style="font-size: 0.875rem; color: var(--muted-foreground);">(${bucket.files.length} files)</span>
                    </div>
                    <p class="bucket-date">Created: ${bucket.createdAt.toLocaleDateString()}</p>
                </div>
                <div class="bucket-files">
                    ${bucket.files
                      .map(
                        (file) => `
                        <div class="bucket-file">
                            <div class="file-header">
                                <div class="file-thumbnail">
                                    <img src="${file.preview}" alt="${file.file.name}">
                                </div>
                                <div class="file-details">
                                    <div class="file-name">${file.file.name}</div>
                                    <div class="file-size">${formatFileSize(file.file.size)} MB</div>
                                    <div class="upload-status">
                                        <i data-lucide="check" style="width: 0.75rem; height: 0.75rem;"></i>
                                        <span>Uploaded</span>
                                    </div>
                                </div>
                            </div>
                            <div class="url-controls">
                                <input type="text" class="url-input" value="${file.url}" readonly>
                                <button class="btn btn-outline btn-sm" onclick="copyToClipboard('${file.url}')">
                                    ${copiedUrl === file.url ? '<i data-lucide="check"></i>' : '<i data-lucide="copy"></i>'}
                                </button>
                                <button class="btn btn-outline btn-sm" onclick="window.open('${file.url}', '_blank')">
                                    <i data-lucide="external-link"></i>
                                </button>
                            </div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
        `
  })

  completedBucketsContainer.innerHTML = html
  lucide.createIcons()
}

// Event listeners
bucketNameInput.addEventListener("input", (e) => {
  updateUploadAreaState()
})

bucketNameInput.addEventListener("blur", () => {
  validateBucketName(bucketNameInput.value)
})

uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault()
  if (uploadArea.classList.contains("enabled")) {
    uploadArea.classList.add("drag-over")
  }
})

uploadArea.addEventListener("dragleave", (e) => {
  e.preventDefault()
  uploadArea.classList.remove("drag-over")
})

uploadArea.addEventListener("drop", (e) => {
  e.preventDefault()
  uploadArea.classList.remove("drag-over")

  if (!uploadArea.classList.contains("enabled")) return

  const droppedFiles = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"))

  if (droppedFiles.length > 0) {
    processFiles(droppedFiles)
  }
})

fileInput.addEventListener("change", (e) => {
  const selectedFiles = Array.from(e.target.files || [])
  if (selectedFiles.length > 0) {
    processFiles(selectedFiles)
  }
})

clearBtn.addEventListener("click", clearAllFiles)

uploadBtn.addEventListener("click", () => {
  if (!isUploading && !files.some((f) => f.status === "uploading")) {
    handleUpload()
  }
})

// Initialize
updateUploadAreaState()
