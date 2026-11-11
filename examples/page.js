import { A11yLongTextToggle, EVENTS } from '../dist/index.js';

const instances = [];
for (const button of document.querySelectorAll('.js-long-text-toggle')) {
  if (button instanceof HTMLButtonElement) {
    instances.push(new A11yLongTextToggle(button));
  }
}

const description = document.getElementById('description');
const state = document.querySelector('[data-demo-state]');
const expandedValue = document.querySelector('[data-expanded-value]');
const descriptionToggle = instances.find((instance) => instance.content === description);
if (descriptionToggle && state && expandedValue) {
  const updateState = () => {
    expandedValue.textContent = descriptionToggle.button.getAttribute('aria-expanded');
  };
  description.addEventListener(EVENTS.toggle, updateState);
  updateState();
  state.hidden = false;
}

const widthControl = document.querySelector('[data-demo-container-width]');
const widthOutput = document.getElementById('container-width-value');
const responsiveContainer = document.getElementById('responsive-container');
if (widthControl instanceof HTMLInputElement
  && widthOutput instanceof HTMLOutputElement
  && responsiveContainer instanceof HTMLElement) {
  widthControl.addEventListener('input', () => {
    responsiveContainer.style.setProperty('--demo-container-width', `${widthControl.value}px`);
    widthOutput.value = `${widthControl.value} px`;
    // Also support browsers without ResizeObserver.
    instances.find((instance) => instance.content.id === 'container-description')?.refresh();
  });
  widthControl.disabled = false;
}

// Content in a closed native details element cannot be measured until opened.
for (const details of document.querySelectorAll('details')) {
  details.addEventListener('toggle', () => {
    if (details.open) {
      for (const instance of instances) {
        if (details.contains(instance.content)) instance.refresh();
      }
    }
  });
}

const copyStatus = document.querySelector('[data-copy-status]');
if (navigator.clipboard?.writeText) {
  for (const button of document.querySelectorAll('[data-copy]')) {
    const source = document.getElementById(button.dataset.copy);
    if (!source || !(button instanceof HTMLButtonElement)) continue;
    const label = source.closest('pre').getAttribute('aria-label');
    button.setAttribute('aria-label', `Copy ${label}`);
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(source.textContent);
        if (copyStatus) copyStatus.textContent = 'Code copied to the clipboard.';
        button.textContent = 'Copied';
        button.setAttribute('aria-label', `Copied ${label}`);
      } catch {
        if (copyStatus) copyStatus.textContent = 'Copy was unavailable. Select and copy the code directly.';
        button.textContent = 'Copy unavailable';
        button.setAttribute('aria-label', `Copy unavailable for ${label}. Select and copy the code directly.`);
      }
    });
    button.hidden = false;
  }
}
