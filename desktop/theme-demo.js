// theme-demo.js
import { ICON } from './src/ui/common/elements/icon.ts';

function generateIconGrid() {
  const iconGrid = document.getElementById('icon-grid');
  let iconsHtml = Object.entries(ICON)
    .map(
      ([key, value]) => `
        <div class="icon-item" title="${key}${key !== value ? ` (${value})` : ''}">
          <un-icon name="${key}"></un-icon>
        </div>
      `
    )
    .join('');
  iconGrid.innerHTML = iconsHtml;
}

window.addEventListener('DOMContentLoaded', () => {
  generateIconGrid();
  generateColorSwatches();
});

function generateColorSwatches() {
  // Get all CSS variables from the document
  const colorGroups = {
    'Brand Colors': {
      Neutral: /^--color-neutral-/,
      Action: /^--color-action-/,
      Reaction: /^--color-reaction-/,
    },
    'Utility Colors': {
      Success: /^--color-success-/,
      Error: /^--color-error-/,
      Highlight: /^--color-highlight-/,
    },
    'UI Color Aliases': {
      Text: /^--color-text-/,
      Background: /^--color-bg-/,
      Border: /^--color-border-/,
    },
  };

  const colorSwatchesContainer = document.getElementById('color-swatches');
  if (!colorSwatchesContainer) return;

  // Get all computed styles
  const styles = getComputedStyle(document.documentElement);
  const cssVars = Array.from(document.styleSheets)
    .filter((sheet) => {
      try {
        // Filter out cross-origin stylesheets
        return (
          sheet.href === null || sheet.href.startsWith(window.location.origin)
        );
      } catch (e) {
        return false;
      }
    })
    .reduce((acc, sheet) => {
      try {
        // Get all CSS rules that contain variable declarations
        const rules = Array.from(sheet.cssRules || []);
        rules.forEach((rule) => {
          if (rule.style) {
            for (let i = 0; i < rule.style.length; i++) {
              const prop = rule.style[i];
              if (prop.startsWith('--color-')) {
                acc.push(prop);
              }
            }
          }
        });
      } catch (e) {
        // Ignore errors
      }
      return acc;
    }, []);

  // Remove duplicates
  const uniqueVars = [...new Set(cssVars)];

  // Create swatches for each group
  for (const [groupName, colorTypes] of Object.entries(colorGroups)) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'color-group';
    groupDiv.innerHTML = `<h3>${groupName}</h3>`;
    let hasColors = false;
    for (const [typeName, regex] of Object.entries(colorTypes)) {
      const typeDiv = document.createElement('div');
      typeDiv.innerHTML = `<h4>${typeName}</h4>`;
      const swatchesDiv = document.createElement('div');
      swatchesDiv.className = 'swatches';
      const matchingVars = uniqueVars.filter((v) => regex.test(v));
      // Sort variables numerically if they end with numbers
      matchingVars.sort((a, b) => {
        const aMatch = a.match(/(\d+)$/);
        const bMatch = b.match(/(\d+)$/);
        if (aMatch && bMatch) {
          return parseInt(aMatch[1]) - parseInt(bMatch[1]);
        }
        return a.localeCompare(b);
      });
      if (matchingVars.length > 0) {
        hasColors = true;
        matchingVars.forEach((varName) => {
          const value = styles.getPropertyValue(varName).trim();
          // Skip if the value is empty or references another var
          if (!value || value.includes('var(--')) {
            return;
          }
          const swatch = document.createElement('div');
          swatch.className = 'swatch';
          swatch.style.backgroundColor = `var(${varName})`;
          swatchesDiv.appendChild(swatch);
        });
        typeDiv.appendChild(swatchesDiv);
        groupDiv.appendChild(typeDiv);
      }
    }
    if (hasColors) {
      colorSwatchesContainer.appendChild(groupDiv);
    }
  }
}
