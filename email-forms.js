// Public Web3Forms routing IDs for the two Project UP forms.
const formIds = {
  "registration": "84a3786a-e867-49dd-8860-6bd49be34957",
  "rfi-form": "dbf3c7e9-53a0-4b17-852e-2a359d705961"
};
const endpoint = 'https://api.web3forms.com/submit';

export function bindEmailForm(form, {prepare, success, afterSuccess}) {
  const fields = form.querySelector('[data-email-fields]');
  const unavailable = form.closest('section')?.querySelector('[data-form-unavailable]') ?? form.querySelector('[data-form-unavailable]');
  const status = form.querySelector('[data-email-status]');
  const formId = formIds[form.id];
  if (!formId) return;
  fields.disabled = false;
  if (unavailable) unavailable.hidden = true;
  let state = 'ready';

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (state !== 'ready' || !form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form));
    const report = message => {
      status.textContent = message;
      status.focus();
    };
    if (values.botcheck) {
      report('This submission could not be accepted. Reload the page and try again.');
      return;
    }
    values.name = values.name?.trim();
    if (!values.name) {
      report('Enter your name before submitting.');
      return;
    }

    let payload;
    try {
      payload = prepare(values);
    } catch (error) {
      report(error.message);
      return;
    }
    payload = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== ''));
    state = 'sending';
    fields.disabled = true;
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Sending…';
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
        body: JSON.stringify({access_key: formId, from_name: 'Project UP', ...payload}),
        signal: AbortSignal.timeout(15000)
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw Error('Submission not accepted');
    } catch {
      state = 'ready';
      fields.disabled = false;
      form.removeAttribute('aria-busy');
      report('We couldn’t confirm that your message was accepted. Your entries are still here. Please try again.');
      return;
    }
    state = 'sent';
    form.removeAttribute('aria-busy');
    form.reset();
    report(success);
    afterSuccess?.();
  });
}


