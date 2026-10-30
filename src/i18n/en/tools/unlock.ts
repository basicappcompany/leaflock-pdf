export default {
  title: 'Unlock PDF',
  metaTitle: 'Remove a PDF password, privately | LeafLock PDF',
  metaDescription:
    'Remove the password and restrictions from a PDF you have the password for. Runs in your browser; nothing is uploaded.',
  summary: 'Remove the password from a PDF you’re allowed to open.',
  howTo: [
    'Choose the password-protected PDF.',
    'Type its password.',
    'Select Unlock PDF and download a copy without the password.',
  ],
  faq: [
    {
      q: 'Is it safe to type my PDF password here?',
      a: 'Yes. The password is only used by your browser to decrypt the file on your device. Neither the password nor the PDF is uploaded.',
    },
    {
      q: 'Can I unlock a PDF without the password?',
      a: 'If the PDF needs a password to open, you need that password; this tool can’t guess or crack it. If it only limits printing, copying or editing, it unlocks without one.',
    },
    {
      q: 'Which password should I type?',
      a: 'The password you use to open the PDF, or its permissions password if it has one.',
    },
    {
      q: 'Does unlocking change the content?',
      a: 'No. You get a copy without the password, with the same pages, text and images.',
    },
    {
      q: 'Is it legal to unlock a PDF?',
      a: 'Only unlock files you own or have permission to change.',
    },
    {
      q: 'Does it work on my phone?',
      a: 'Yes. It works in a modern browser on phones, tablets and computers, with nothing to install.',
    },
  ],
  checking: 'Checking the file…',
  passwordLabel: 'Password',
  passwordHint: 'The password you use to open this PDF, or its permissions password.',
  show: 'Show password',
  needsPassword: 'This PDF needs a password to open. Type it below.',
  restrictionsRemoved: 'This PDF had no open password, only limits on printing, copying or editing. They’re removed in this copy.',
  unlocked: 'The password is removed from this copy.',
  legalNote: 'Only unlock files you own or have permission to change.',
  action: 'Unlock PDF',
  outputSuffix: 'unlocked',
  errors: {
    'not-encrypted': '{name} isn’t password-protected, so there’s nothing to unlock.',
    'needs-password': '{name} needs a password to open. Type it below.',
  },
};
