document.addEventListener("DOMContentLoaded", () => {
  updateConclusion();
  toggleFields();
  calculateError();
  bindErrorListeners();
  initFormSubmit();
});

function updateConclusion() {
  const invalidBlock = document.querySelector(".invalid-conclusion");
  const invalidText = document.getElementById("invalid-conclusion-text");
  const thirdInvalid = document.querySelector(".third-invalid-conclusion");
  const validBlock = document.querySelector(".valid-conclusion");

  if (window.reasonType) {
    invalidBlock.style.display = "block";
    invalidText.textContent = `Заключение: средство измерений признано непригодным, по причине: ${window.reasonFullName}`;
    thirdInvalid.style.display = "none";
    validBlock.style.display = "none";
  }
}

function toggleFields() {
  const useOpt = document.getElementById("use_opt")?.value;
  const secondInputs = document.querySelectorAll('[name^="second_"]');
  const thirdInputs = document.querySelectorAll('[name^="third_"]');
  const visible = useOpt !== "True";
  [...secondInputs, ...thirdInputs].forEach((input) => {
    input.style.display = visible ? "block" : "none";
  });
}

function calculateError() {
  const meterFields = document.querySelectorAll(`
    [name^="first_meter_water_according_"],
    [name^="second_meter_water_according_"],
    [name^="third_meter_water_according_"]
  `);
  const referenceFields = document.querySelectorAll(`
    [name^="first_reference_water_according_"],
    [name^="second_reference_water_according_"],
    [name^="third_reference_water_according_"]
  `);
  const resultFields = document.querySelectorAll(`
    [name^="first_water_count_"],
    [name^="second_water_count_"],
    [name^="third_water_count_"]
  `);

  for (let i = 0; i < meterFields.length; i++) {
    const meterValue = parseFloat(meterFields[i].value) || 0;
    const referenceValue = parseFloat(referenceFields[i].value) || 0;
    resultFields[i].value = referenceValue
      ? (((meterValue - referenceValue) / referenceValue) * 100).toFixed(2)
      : "";
  }
  validateError();
}

function validateError() {
  let isInvalid = false;
  isInvalid = validateErrorForRange("qmin", 5) || isInvalid;
  isInvalid = validateErrorForRange("qp", 2) || isInvalid;
  isInvalid = validateErrorForRange("qmax", 2) || isInvalid;

  const hiddenInput = document.querySelector('[name="high_error_rate"]');
  if (hiddenInput) hiddenInput.value = isInvalid ? "true" : "false";

  toggleConclusion(isInvalid);
}

function validateErrorForRange(range, limit) {
  const fields = document.querySelectorAll(`
    [name^="first_water_count_${range}"],
    [name^="second_water_count_${range}"],
    [name^="third_water_count_${range}"]
  `);
  let invalid = false;

  fields.forEach((field) => {
    const value = parseFloat(field.value);
    const bad = !isNaN(value) && (value > limit || value < -limit);
    field.style.backgroundColor = bad ? "#f8d7da" : "";
    field.style.color = bad ? "#721c24" : "";
    if (bad) invalid = true;
  });
  return invalid;
}

function toggleConclusion(isInvalid) {
  const validBlock = document.querySelector(".valid-conclusion");
  const invalidBlock = document.querySelector(".invalid-conclusion");
  const thirdInvalid = document.querySelector(".third-invalid-conclusion");

  if (!isInvalid) {
    thirdInvalid.style.display = "none";
    if (invalidBlock.style.display === "none") validBlock.style.display = "block";
  } else {
    thirdInvalid.style.display = "block";
    validBlock.style.display = "none";
  }
}

function bindErrorListeners() {
  const inputs = document.querySelectorAll(`
    [name^="first_meter_water_according_"],
    [name^="second_meter_water_according_"],
    [name^="third_meter_water_according_"],
    [name^="first_reference_water_according_"],
    [name^="second_reference_water_according_"],
    [name^="third_reference_water_according_"]
  `);
  inputs.forEach((input) => input.addEventListener("input", calculateError));
}

function initFormSubmit() {
  const form = document.getElementById("update-entry-form");
  if (!form) return;

  const params = new URLSearchParams({
    company_id: window.companyId,
    verification_entry_id: window.verificationEntryId,
    metrolog_info_id: window.metrologInfoId,
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        `/verification/api/metrologs-control/update/?${params.toString()}`,
        {
          method: "POST",
          body: new FormData(form),
        }
      );
      if (!res.ok) throw new Error();
      window.location.href = `/verification/?company_id=${window.companyId}`;
    } catch {
      alert("Ошибка при сохранении данных. Попробуйте снова.");
    }
  });
}
