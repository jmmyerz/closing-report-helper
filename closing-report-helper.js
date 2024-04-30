/* =============================
 * Rides Closing Report Helper
 * - by Jordan Myers
 * -             &
 * - by Arthur Taft
 * - version 1.3.0 (Apr 30 2024)
 * ============================= */

// Create a globally-scoped object to store timeouts for each fieldset
const timeoutStore = {};;

// Set the button colors for each area globally
const areaColor = {
  1: '#bbf7d0',
  2: '#fbcfe8',
  3: '#fef08a',
  4: '#fda4af',
  5: '#fed7aa',
  6: '#facc15',
  7: '#bfdbfe',
  8: '#ddd6fe',
  9: '#51e077',
  10: '#f55b9b',
};

// Set button colors using RGBA values for table headers
const rgbaAreaColor = {
  1: 'rgba(187, 247, 208, 0.5)',
  2: 'rgba(251, 207, 232, 0.5)',
  3: 'rgba(254, 240, 138, 0.5)',
  4: 'rgba(253, 164, 175, 0.5)',
  5: 'rgba(254, 215, 170, 0.5)',
  6: 'rgba(250, 204, 21, 0.5)',
  7: 'rgba(191, 219, 254, 0.5)',
  8: 'rgba(221, 214, 254, 0.5)',
  9: 'rgba(81, 224, 119, 0.5)',
  10: 'rgba(245, 91, 155, 0.5)',
};

// Handle swapping beginning/ending counts when clicking an eligible field
function clickToSwap(rideId) {
  const endNode = document.querySelector(`input[name="${rideId}_endcount"]`); // Get the ending count field for the given rideId
  const beginNode = document.querySelector(`input[name="${rideId}_begcount"]`); // Get the beginning count field for the given rideId

  // Swap the value parameters
  [endNode.value, beginNode.value] = [beginNode.value, endNode.value];

  // Javascript is stupid, so sync with the DOM
  endNode.setAttribute('value', endNode.value);
  beginNode.setAttribute('value', beginNode.value);

  // Fire a change event to update the difference field
  endNode.dispatchEvent(new Event('change'));
  console.log('Swap Success!');
}

// Create a listener for click events on a difference field
function createClickToSwapListener(differenceField, rideId) {
  differenceField.addEventListener('click', () => {
    clickToSwap(rideId);
  });
}

// Function to calculate and update the difference for a given form row, corresponding to a ride
// Called on updates to the beginning/ending counts and when injecting the difference fields
function calcDiff(rideId) {
  //const targetNode = document.querySelector(`input[name="${rideId}_diff"]`); // Get the difference field for the given rideId
  const targetNode = document.querySelector(`input[name="${rideId}_sum"]`); // Get the difference field for the given rideId
  const endNode = document.querySelector(`input[name="${rideId}_endcount"]`); // Get the ending count field for the given rideId
  const beginNode = document.querySelector(`input[name="${rideId}_begcount"]`); // Get the beginning count field for the given rideId

  // Avoid self-inflicted NaN by setting null values to 0 for our calculation
  const endValue = endNode.value != null ? endNode.value : 0;
  const beginValue = beginNode.value != null ? beginNode.value : 0;

  // I hope you can figure out how subtraction works...
  const newValue = endValue - beginValue;

  // Set color and optionally abort a click listener
  function setColor(color) {
    targetNode.title = color === null ? '' : 'Click to swap beginning / end values';
    targetNode.setAttribute('class', color === null ? null : color);
  }

  // Hilight the difference field with colors to match its value
  switch (true) {
    case Number.isNaN(newValue): // Check for non-number value issues
    case newValue < 0:
      // Red for errors or negative numbers
      setColor('red pointer');
      break;
    case newValue >= 1 && newValue <= 500:
    case newValue >= 10000:
      // Yellow for 1-500 (inclusive) and 10,000+ values
      setColor('yellow pointer');
      break;
    case newValue === 0:
      setColor(null);
      break; // Leave null or 0 fields alone
    default:
      // Green for everything else
      setColor('green pointer');
      break;
  }
  // Update the value displayed, showing an error for non-number values or nothing for 0
  if (Number.isNaN(newValue)) {
    targetNode.value = 'Error!';
  } else {
    // targetNode.value = newValue === 0 ? null : newValue;
    // targetNode.setAttribute('value', newValue || 0);
  }
}

// Function to inject the necessary header and input fields to display the difference
// Called whenever the form changes
function injectDifferenceFields() {
  const table = document.querySelector('table#mytable'); // Select the table containing the entry form
  if (table) {
    // Get all the header (th) elements, then sort through them to find the beginning count
    const headers = table.querySelectorAll('th');
    const headerRegex = /^Beg[.]? Count$/gi;
    let beginCountHeader = null;
    headers.forEach((header) => {
      const found = header.textContent.match(headerRegex);
      if (found) { beginCountHeader = header; }
    });
    // Create a new "difference" header element and inject it after beginning count
    // const differenceHeader = Object.assign(document.createElement('th'), {
    //   scope: 'col',
    //   textContent: 'Difference',
    // });
    // beginCountHeader.insertAdjacentElement('afterend', differenceHeader);

    const textFields = table.querySelectorAll('td > input[type=text]'); // Get all text input fields
    textFields.forEach((field) => {
      const beginEndRegex = /([0-9]+_?[0-9]+)_(begcount|endcount)/i; // Matches rideId and both beginning count and ending count fields
      const found = field.name.match(beginEndRegex);
      if (found) {
        // If this is a beginning count field, inject a new (disabled) field
        // after it to store the difference. Call calcDiff to calculate the
        // difference in case there's already data present in the form
        if (found[2] === 'begcount') {
          // const differenceField = Object.assign(document.createElement('td'), {
          //   innerHTML: `<input type="text" name="${found[1]}_diff" value="" size="8" disabled>`,
          // });
          const differenceRegex = /([0-9]+_?[0-9]+)_sum/i;
          const differenceField = field.name.match(differenceRegex);

          // Select the <input> inside differenceField to use for the event listener
          const differenceInput = document.getElementById(found[1] + '_sum')
          // Add a "disabled" prop to the input field
          differenceInput.setAttribute('disabled', '');
          // Add size="8" to the input field
          differenceInput.setAttribute('size', '8');

          createClickToSwapListener(differenceInput, found[1]);
          // field.parentNode.insertAdjacentElement('afterend', differenceField);
          calcDiff(found[1]);
        }

        // Watch the beginning and ending counts for input
        field.addEventListener('input', () => {
          // If timeoutStore already had an input timeout for
          // this ride, clear it and restart the timeout
          if (timeoutStore[found[1]]) { clearTimeout(timeoutStore[found[1]]); }
          // Set a timeout for 1 second, giving the user time to
          // finish their input, then calculate the difference
          timeoutStore[found[1]] = setTimeout(() => { calcDiff(found[1]); }, 1000);
        });

        // Watch the beginning and ending counts for change events (includes focusout)
        field.addEventListener('change', () => {
          calcDiff(found[1]);
        });
      }
    });
  }
  console.log('Difference Field Injected');
}

function setAreaColors() {
  // Set the current area color to a more readable variable
  let currentAreaColor = areaColor[area.value];

  // Use the rgba area colors for the light background
  let currentAreaColorLight = rgbaAreaColor[area.value];
  console.log(currentAreaColor);
  
  // Get all the headers in the data entry table
  const darkElement = document.querySelectorAll('#mytable th').forEach((header) => {
    // Modify only headers with no class name
    if (header.className === '') {
      // Set the background color of the header to the current area color
      header.style.setProperty('--custom-color', currentAreaColor); 
    }
  });

  // Get all the table data elements in the table
  const lightElement = document.querySelectorAll('#mytable td').forEach((data) => {
    // Modify only data elements with the 'alt' class name
    if (data.className === 'alt') {
      // Set the background color of the data element to the light version of the current area color
      data.style.setProperty('--custom-color-light', currentAreaColorLight);
    }
  });
}

// Use an observer to make sure the colors don't load before the other page information
// IF YOU GET RID OF THIS THE TABLE COLORS WILL NOT LOAD
function runAreaColors() {
  // Get the entry form
  const dataForm = document.querySelector('#dataForm');
  // Create an observer for the form
  const formObserver = new MutationObserver(setAreaColors);
  // Observe the form for changes to the child nodes (i.e., when the area has been changed)
  formObserver.observe(dataForm, { childList: true });
}

// To be called on DOM load
function runDifferenceObserver() {
  // Get the entry form
  const dataForm = document.querySelector('#dataForm');
  // Create an observer for the form
  const formObserver = new MutationObserver(injectDifferenceFields);
  // Observe the form for changes to the child nodes (i.e., when the area has been changed)
  formObserver.observe(dataForm, { childList: true });
}

// Run all the relevant things after DOM load
document.body.onload = () => {
  // Run the difference injector/observer
  runDifferenceObserver();
  runAreaColors();

  // Some style changes to the area selector and difference fields
  const originalAreaSelector = document.querySelector('select#area');
  const originalAreaOptions = document.querySelectorAll('select#area option');

  // Create a wrapper div for the button group and insert it
  const buttonsDiv = Object.assign(document.createElement('div'), {
    id: 'area-buttons',
  });
  originalAreaSelector.insertAdjacentElement('afterend', buttonsDiv);

  // Make the first button a label for the group
  const labelButton = Object.assign(document.createElement('button'), {
    innerHTML: 'Area',
    style: 'background-color: rgba(0, 0, 0, 0.1);',
  });
  labelButton.setAttribute('class', 'no-pointer');
  buttonsDiv.insertAdjacentElement('beforeend', labelButton);

  // Each area selector gets a button with similar properties
  originalAreaOptions.forEach((area) => {
    const areaButton = Object.assign(document.createElement('button'), {
      id: `area-${area.value}`,
      value: area.value,
      innerHTML: area.value,
      style: `background-color: ${areaColor[area.value]};`,
    });
    areaButton.setAttribute('class', area.selected ? 'active' : ''); // Make the default selection active on load
    
    // Add a click listener to spoof the original selector
    // (utilizing the built-in onchange function)
    areaButton.addEventListener('click', () => {
      document.querySelector(`select#area option[value="${area.value}"]`).selected = true;
      document.querySelectorAll('#area-buttons button').forEach((btn) => {
        if (btn.value === areaButton.value) {
          btn.setAttribute('class', 'active');
        } else {
          btn.setAttribute('class', '');
        }
      });
      originalAreaSelector.dispatchEvent(new Event('change'));
    });
    // Insert the new button at the end of the div
    buttonsDiv.insertAdjacentElement('beforeend', areaButton);
  });

  window.CSS.registerProperty({
    name: "--custom-color",
    syntax: "<color>",
    inherits: false,
    initialValue: 'rgba(0, 0, 0, 0.2)',
  });

  window.CSS.registerProperty({
    name: "--custom-color-light",
    syntax: "<color>",
    inherits: false,
    initialValue: 'rgba(0, 0, 0, 0.05',
  });
  
  // Inject an inline stylesheet
  const selectorStyle = Object.assign(document.createElement('style'), {
    innerHTML: `
      select#area{
        display: none;
      }
      #area-buttons button {
        border: 2px solid rgba(0, 0, 0, 0.2);
        min-width: 3em;
        padding: 10px;
        float: left;
        font-weight: bold;
        color: rgba(0, 0, 0, 0.6);
      }
      #area-buttons button.no-pointer {
        cursor: default; 
      }
      #area-buttons button:not(:last-child) {
        border-right: none;
      }
      #area-buttons button:first-child {
        border-radius: 8px 0 0 8px;
        cursor: default;
      }
      #area-buttons button:last-child {
        border-radius: 0 8px 8px 0;
      }
      #area-buttons:after {
        content: "";
        clear: both;
        display: table;
      }
      #area-buttons button:not(:first-child):hover,
      #area-buttons button.active {
        cursor: pointer;
        text-decoration: underline;
        text-decoration-thickness: 2px;
        text-underline-offset: 5px;
      }
      input.red {
        background-color: #fda4af;
      }
      input.yellow {
        background-color: #fef08a;
      }
      input.green {
        background-color: #a7f3d0;
      }
      input.pointer {
        cursor: pointer;
      }
    `,
  });

  // Hijack the present data form and get rid of the horrible formatting by injecting an inline stylesheet
  const dataTableStyle = Object.assign(document.createElement('style'), {
    innerHTML: `
      table {
        border-collapse: separate;
      }

      #mytable th {
        color: rgb(0, 0, 0);
        background: none;
        background-color: var(--custom-color);
        border-collapse: collapse;
        border-bottom: 1px solid rgba(0, 0, 0, 0.3);
        border-right: 1px solid rgba(0, 0, 0, 0.3);
        border-top: 1px solid rgba(0, 0, 0, 0.3);
        font-size: 14px;
        font-weight: bold;
        letter-spacing: 1px;
        padding: 4px;
        text-align: center;
        text-transform: none;
      }

      #mytable th.nobg {
        background: none;
        background-color: rgba(0, 0, 0, 0.1);
        border-collapse: separate;
        border-right: 1px solid rgba(0, 0, 0, 0.3);
        border-top-left-radius: 8px;
      }

      #mytable th.spec {
        background: none;
        border-left: 1px solid rgba(0, 0, 0, 0.3);
        border-right: 1px solid rgba(0, 0, 0, 0.3);
        border-top: 1px solid rgba(0, 0, 0, 0.3);
        border-collapse: collapse;
        border-radius: 0px;
        font-size: 16px;
      }

      #mytable th.specalt {
        color: rgba(0, 0, 0, 0.7);
        background: none;
        border-collapse: collapse;
        border-left: 1px solid rgba(0, 0, 0, 0.3);
        border-right: 1px solid rgba(0, 0, 0, 0.3);
        font-size: 16px;
      }

      #mytable th:last-child {
        border-collapse: separate;
        border-top-right-radius: 8px;
      }

      #mytable td {
        background: none;
        border-collapse: collapse;
        border-bottom: 1px solid rgba(0, 0, 0, 0.3);
        border-right: 1px solid rgba(0, 0, 0, 0.3);
        padding: 6px 6px 6px 6px;
      }

      #mytable td.alt {
        background-color: var(--custom-color-light);
      }

      #mytable:after {
        content: "";
        clear: both;
        display: table;
      }
    `
  });

  // Change the formatting of the submit button to be more user friendly, once again by injecting an inline stylesheet
  const submitButtonStyle = Object.assign(document.createElement('style'), {
    innerHTML: `
      input[type=submit] {
        color: rgba(0, 0, 0, 0.6);
        background-color: rgba(0, 0, 0, 0.1);
        border: 2px solid rgba(0, 0, 0, 0.3);
        border-radius: 8px;
        float: center; 
        font-weight: bold;
        margin-left: 20vw;
        margin-top: 10px;
        min-height: 7vh;
        min-width: 25vw;
      }
    `
  });

  // Change the margin of the date selector and data table so things are spaced out
  const bigMargin = Object.assign(document.createElement('style'), {
    innerHTML: `
      #datepicker {
        margin-bottom: 30px;
      }
    `
  });
  document.querySelector('head').appendChild(selectorStyle);
  console.log('Buttons Loaded');
  document.querySelector('head').appendChild(dataTableStyle);
  console.log('Custom Table Loaded')
  document.querySelector('head').appendChild(submitButtonStyle);
  console.log('Custom Submit Button Loaded')
  document.querySelector('head').appendChild(bigMargin);
  console.log('Load Success!');
};
