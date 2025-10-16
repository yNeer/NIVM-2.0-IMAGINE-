/* tslint:disable */
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI, Modality } from '@google/genai';

// --- TYPE DEFINITIONS ---
interface ImageState {
  file: File | null;
  base64: string | null;
}

// --- DOM ELEMENT SELECTION ---
const statusEl = document.querySelector('#status') as HTMLParagraphElement;
const generateButton = document.querySelector('#generate-button') as HTMLButtonElement;
const outputImage = document.querySelector('#output-image') as HTMLImageElement;
const outputContainer = document.querySelector('#output-container') as HTMLDivElement;

const styleImageInput = document.querySelector('#style-image-input') as HTMLInputElement;
const styleImagePreview = document.querySelector('#style-image-preview') as HTMLImageElement;
const styleImageLabel = document.querySelector('#style-image-label') as HTMLLabelElement;
const removeStyleImageBtn = document.querySelector('#remove-style-image') as HTMLButtonElement;
const styleTextInput = document.querySelector('#style-text-input') as HTMLTextAreaElement;

const baseImageInput = document.querySelector('#base-image-input') as HTMLInputElement;
const baseImagePreview = document.querySelector('#base-image-preview') as HTMLImageElement;
const baseImageLabel = document.querySelector('#base-image-label') as HTMLLabelElement;
const removeBaseImageBtn = document.querySelector('#remove-base-image') as HTMLButtonElement;
const baseTextInput = document.querySelector('#base-text-input') as HTMLTextAreaElement;

const poseImageInput = document.querySelector('#pose-image-input') as HTMLInputElement;
const poseImagePreview = document.querySelector('#pose-image-preview') as HTMLImageElement;
const poseImageLabel = document.querySelector('#pose-image-label') as HTMLLabelElement;
const removePoseImageBtn = document.querySelector('#remove-pose-image') as HTMLButtonElement;
const poseTextInput = document.querySelector('#pose-text-input') as HTMLTextAreaElement;

const printQualityCheckbox = document.querySelector('#print-quality-checkbox') as HTMLInputElement;
const promptSummaryEl = document.querySelector('#prompt-summary') as HTMLTextAreaElement;

// --- STATE MANAGEMENT ---
const state = {
  styleImage: { file: null, base64: null } as ImageState,
  baseImage: { file: null, base64: null } as ImageState,
  poseImage: { file: null, base64: null } as ImageState,
  styleText: '',
  baseText: '',
  poseText: '',
  printQuality: false,
  isLoading: false,
};

// --- HELPER FUNCTIONS ---
function fileToBase64(file: File): Promise<{ dataUrl: string; base64: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      resolve({ dataUrl, base64 });
    };
    reader.onerror = (error) => reject(error);
  });
}

function showStatus(message: string, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? 'var(--error-red)' : 'var(--text-secondary)';
}

function setControlsDisabled(disabled: boolean) {
  state.isLoading = disabled;
  generateButton.disabled = disabled || !state.styleImage.file || !state.baseImage.file;
  styleImageInput.disabled = disabled;
  baseImageInput.disabled = disabled;
  poseImageInput.disabled = disabled;
  styleTextInput.disabled = disabled;
  baseTextInput.disabled = disabled;
  poseTextInput.disabled = disabled;
  printQualityCheckbox.disabled = disabled;
}

function updateGenerateButtonState() {
    if (state.isLoading) return;
    generateButton.disabled = !state.styleImage.file || !state.baseImage.file;
}

function updatePromptSummary() {
    let summary = `Combine the style and color palette of the first image (Art Style) with the face and identity of the second image (Your Image). Always remove the background of the second (Your Image) image.`;

    if (state.poseImage.file) {
        summary += ` Mimic the gesture or mood of the third image (Pose Reference).`;
    }

    if (state.printQuality) {
        summary += ` Output a realistic, high-detail, print-ready fusion.`;
    } else {
        summary += ` Output a detailed and cohesive fusion.`;
    }
    
    const descriptions = [
        state.styleText ? `Art Style Description: "${state.styleText}"` : '',
        state.baseText ? `Your Image Description: "${state.baseText}"` : '',
        state.poseText ? `Pose Reference Description: "${state.poseText}"` : ''
    ].filter(Boolean).join('\n');

    if (descriptions) {
        summary += `\n\n--- User Descriptions ---\n${descriptions}`;
    }

    promptSummaryEl.value = summary.trim();
}

// --- EVENT HANDLERS ---
async function handleFileChange(event: Event, imageType: 'style' | 'base' | 'pose') {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const { dataUrl, base64 } = await fileToBase64(file);

  if (imageType === 'style') {
    state.styleImage = { file, base64 };
    styleImagePreview.src = dataUrl;
    styleImagePreview.style.display = 'block';
    styleImageLabel.style.display = 'none';
    removeStyleImageBtn.style.display = 'block';
  } else if (imageType === 'base') {
    state.baseImage = { file, base64 };
    baseImagePreview.src = dataUrl;
    baseImagePreview.style.display = 'block';
    baseImageLabel.style.display = 'none';
    removeBaseImageBtn.style.display = 'block';
  } else {
    state.poseImage = { file, base64 };
    poseImagePreview.src = dataUrl;
    poseImagePreview.style.display = 'block';
    poseImageLabel.style.display = 'none';
    removePoseImageBtn.style.display = 'block';
  }
  updatePromptSummary();
  updateGenerateButtonState();
}

function handleRemoveImage(imageType: 'style' | 'base' | 'pose') {
  if (imageType === 'style') {
    state.styleImage = { file: null, base64: null };
    styleImageInput.value = '';
    styleImagePreview.src = '';
    styleImagePreview.style.display = 'none';
    styleImageLabel.style.display = 'flex';
    removeStyleImageBtn.style.display = 'none';
  } else if (imageType === 'base') {
    state.baseImage = { file: null, base64: null };
    baseImageInput.value = '';
    baseImagePreview.src = '';
    baseImagePreview.style.display = 'none';
    baseImageLabel.style.display = 'flex';
    removeBaseImageBtn.style.display = 'none';
  } else {
    state.poseImage = { file: null, base64: null };
    poseImageInput.value = '';
    poseImagePreview.src = '';
    poseImagePreview.style.display = 'none';
    poseImageLabel.style.display = 'flex';
    removePoseImageBtn.style.display = 'none';
  }
  updatePromptSummary();
  updateGenerateButtonState();
}

function setupEventListeners() {
    styleImageInput.addEventListener('change', (e) => handleFileChange(e, 'style'));
    baseImageInput.addEventListener('change', (e) => handleFileChange(e, 'base'));
    poseImageInput.addEventListener('change', (e) => handleFileChange(e, 'pose'));

    removeStyleImageBtn.addEventListener('click', () => handleRemoveImage('style'));
    removeBaseImageBtn.addEventListener('click', () => handleRemoveImage('base'));
    removePoseImageBtn.addEventListener('click', () => handleRemoveImage('pose'));

    styleTextInput.addEventListener('input', () => { state.styleText = styleTextInput.value; updatePromptSummary(); });
    baseTextInput.addEventListener('input', () => { state.baseText = baseTextInput.value; updatePromptSummary(); });
    poseTextInput.addEventListener('input', () => { state.poseText = poseTextInput.value; updatePromptSummary(); });
    
    printQualityCheckbox.addEventListener('change', () => { state.printQuality = printQualityCheckbox.checked; updatePromptSummary(); });

    generateButton.addEventListener('click', generate);
}

// --- CORE GENERATION LOGIC ---
async function generate() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    showStatus('API key is not configured. Please add your API key.', true);
    return;
  }
  if (!state.styleImage.file || !state.baseImage.file) {
      showStatus('Please provide at least a Style and a Base image.', true);
      return;
  }

  showStatus('Generating image...');
  outputImage.style.display = 'none';
  setControlsDisabled(true);

  const parts: (
    | { text: string }
    | { inlineData: { data: string; mimeType: string } }
  )[] = [];
  
  parts.push({ text: promptSummaryEl.value });

  // Add images in order: Style, Base, Pose
  if (state.styleImage.base64 && state.styleImage.file) {
    parts.push({
      inlineData: {
        data: state.styleImage.base64,
        mimeType: state.styleImage.file.type,
      },
    });
  }
  if (state.baseImage.base64 && state.baseImage.file) {
    parts.push({
      inlineData: {
        data: state.baseImage.base64,
        mimeType: state.baseImage.file.type,
      },
    });
  }
  if (state.poseImage.base64 && state.poseImage.file) {
    parts.push({
      inlineData: {
        data: state.poseImage.base64,
        mimeType: state.poseImage.file.type,
      },
    });
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const firstPart = response.candidates?.[0]?.content?.parts?.[0];
    if (firstPart && 'inlineData' in firstPart && firstPart.inlineData) {
        const base64ImageBytes = firstPart.inlineData.data;
        const mimeType = firstPart.inlineData.mimeType || 'image/png';
        outputImage.src = `data:${mimeType};base64,${base64ImageBytes}`;
        outputImage.style.display = 'block';
        showStatus('Image generated successfully.');
    } else {
        throw new Error('No image was generated. The prompt may have been blocked.');
    }
  } catch (e) {
    console.error('Image generation failed:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    showStatus(`Error: ${errorMessage}`, true);
  } finally {
    setControlsDisabled(false);
  }
}

// --- INITIALIZATION ---
function init() {
    setupEventListeners();
    updatePromptSummary();
}

init();