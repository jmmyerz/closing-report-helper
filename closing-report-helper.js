/* =============================
 * Rides Closing Report Helper
 * - by Jordan Myers
 * - version 0.1.6 (6/22/2023)
 * ============================= */

// Create a globally-scoped object to store timeouts for each field
const timeoutStore = {};

// Function to calculate and update the difference for a given form row, corresponding to a ride
// Called on updates to the beginning/ending counts and when injecting the difference fields
function calcDiff(rideId) {
  const targetNode = document.querySelector(`input[name="${rideId}_diff"]`); // Get the difference field for the given rideId
  const endNode = document.querySelector(`input[name="${rideId}_endcount"]`); // Get the ending count for the given rideId
  const beginNode = document.querySelector(`input[name="${rideId}_begcount"]`); // Get the beginning count for the given rideId

  // Avoid self-inflicted NaN by setting null values to 0 for our calculation
  const endValue = endNode.value != null ? endNode.value : 0;
  const beginValue = beginNode.value != null ? beginNode.value : 0;

  // I hope you can figure out how subtraction works...
  const newValue = endValue - beginValue;

  // Hilight the difference field with colors to match its value
  switch (true) {
    case Number.isNaN(newValue): // Check for non-number value issues
    case newValue < 0:
      // Bootstrap danger (red) for errors or negative numbers
      targetNode.style = `
        background-color: rgb(220, 53, 69);
        color: rgb(255, 255, 255);
      `;
      break;
    case newValue >= 1 && newValue <= 500:
    case newValue >= 10000:
      // Bootsrap warning (yellow) for 1-500 (inclusive) and 10,000+ values
      targetNode.style = `
        background-color: rgb(255, 193, 7);
        color: rgb(0, 0, 0);
      `;
      break;
    case newValue === 0:
      break; // Leave null or 0 fields alone
    default:
      // Everything else should be bootsrap success (green)
      targetNode.style = `
        background-color: rgb(25, 135, 84);
        color: rgb(255, 255, 255);
      `;
      break;
  }
  // Update the value displayed, showing an error for non-number values or nothing for 0
  if (Number.isNaN(newValue)) {
    targetNode.value = 'Error!';
  } else {
    targetNode.value = newValue === 0 ? null : newValue;
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
      if (found) {
        beginCountHeader = header;
      }
    });
    // Create a new "difference" header element and inject it after beginning count
    const differenceHeader = Object.assign(document.createElement('th'), {
      scope: 'col',
      textContent: 'Difference',
    });
    beginCountHeader.insertAdjacentElement('afterend', differenceHeader);

    const textFields = table.querySelectorAll('td > input[type=text]'); // Get all text input fields
    textFields.forEach((field) => {
      const beginEndRegex = /([0-9]+)_(begcount|endcount)/i; // Matches rideId and both beginning count and ending count fields
      const found = field.name.match(beginEndRegex);
      if (found) {
        // If this is a beginning count field, inject a new (disabled) field
        // after it to store the difference. Call calcDiff to calculate the
        // difference in case there's already data present in the form
        if (found[2] === 'begcount') {
          const differenceField = Object.assign(document.createElement('td'), {
            innerHTML: `<input type="text" name="${found[1]}_diff" value="" size="8" disabled>`,
          });
          field.parentNode.insertAdjacentElement('afterend', differenceField);
          calcDiff(found[1]);
        }

        // Watch the beginning and ending counts for changes
        field.addEventListener('input', () => {
          // If timeoutStore already had an input timeout for
          // this ride, clear it and restart the timeout
          if (timeoutStore[found[1]]) {
            clearTimeout(timeoutStore[found[1]]);
          }
          // Set a timeout for 1 second, giving the user time to
          // finish their input, then calculate the difference
          timeoutStore[found[1]] = setTimeout(() => {
            calcDiff(found[1]);
          }, 1000);
        });
      }
    });
  }
}

// To be called on DOM load
function runDifferenceObserver() {
  // Get the entry form
  const dataForm = document.querySelector('#dataForm');
  // Create an observer for the form
  const formObserver = new MutationObserver(() => {
    injectDifferenceFields();
  });
  // Observe the form for changes to the child nodes (i.e., when the area has been changed)
  formObserver.observe(dataForm, {
    childList: true,
  });
}

// Run all the relevant things after DOM load
document.body.onload = () => {
  // Run the difference injector/observer
  runDifferenceObserver();

  // Some style changes to the area selector
  Object.assign(document.querySelector('select#area'), {
    multiple: true,
  });
  const selectorStyle = Object.assign(document.createElement('style'), {
    innerHTML: `
      select#area{
        height: 30px;
        border: none;
        overflow: hidden;
      }
      select#area:focus {
        outline: none;
      }
      select#area option {
        padding: 5px;
        margin-right: 5px;
        text-align: center;
        display: inline-block;
        border: solid 1px;
        border-radius: 7px;
      }
    `,
  });
  document.querySelector('head').appendChild(selectorStyle);
};
