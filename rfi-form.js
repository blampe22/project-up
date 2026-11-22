import {bindEmailForm} from './email-forms.js?v=qc03-test1';

bindEmailForm(document.querySelector('#rfi-form'), {
  prepare(fields) {
    const subject = fields.topic.trim();
    const question = fields.question.trim();
    if (!subject || !question) throw Error('Enter a subject and a question or comment.');
    return {subject: 'Project UP — RFI: ' + subject, name: fields.name,
      email: fields.email, 'Question / Comment': question};
  },
  success: 'Your RFI was accepted for delivery to Ben.',
  afterSuccess() {
    document.querySelector('#rfi-confirmation').hidden = false;
  }
});

