export default {
  title: 'Protect PDF',
  metaTitle: 'Password-protect a PDF with AES-256, privately | LeafLock PDF',
  metaDescription:
    'Add a password to a PDF with strong AES-256 encryption, and limit printing or copying. Encrypted on your device.',
  summary: 'Add a password so only people who know it can open the PDF.',
  howTo: [
    'Choose a PDF.',
    'Type a password, and choose what people may do with the file.',
    'Select Protect PDF and download the encrypted file.',
  ],
  faq: [
    {
      q: 'Is my password sent anywhere?',
      a: 'No. The PDF is encrypted in your browser on your device, so neither the file nor the password is ever sent to us.',
    },
    {
      q: 'How strong is the protection?',
      a: 'The file is encrypted with AES-256. How well it holds up depends mostly on your password, so use a long one that’s hard to guess.',
    },
    {
      q: 'What if I forget the password?',
      a: 'Then nobody can open the file, including us. Keep the password somewhere safe, or keep an unprotected copy in a safe place.',
    },
    {
      q: 'Can I stop people from printing or copying?',
      a: 'Yes. Choose what people may do after opening the file. PDF readers are asked to honor these limits, but some ignore them; only the open password truly protects the file.',
    },
    {
      q: 'What is the permissions password for?',
      a: 'It’s a second password for changing the limits on printing, copying and editing. If you don’t set one, a random one is used.',
    },
    {
      q: 'Can I protect a PDF that already has a password?',
      a: 'If it needs a password to open, remove it with Unlock PDF first, then protect it with the new one. Files that only restrict printing or editing can be protected directly.',
    },
  ],
  passwordLabel: 'Password to open the PDF',
  confirmLabel: 'Type the password again',
  show: 'Show passwords',
  mismatch: 'The passwords don’t match.',
  strength: {
    weak: 'Weak: use at least 8 characters.',
    fair: 'Fair: a longer password, or a mix of letters, numbers and symbols, is stronger.',
    strong: 'Strong password.',
  },
  forgetWarning: 'Keep this password safe. If you forget it, nobody can open the file, including us.',
  permissionsHeading: 'What people can do after opening it',
  permissions: {
    printing: 'Printing',
    copying: 'Copy text and images',
    modifying: 'Change the content',
    annotating: 'Add comments',
    fillingForms: 'Fill in forms',
    documentAssembly: 'Insert, delete or rotate pages',
  },
  printingOptions: { high: 'Allowed', low: 'Low quality only', none: 'Not allowed' },
  permissionsNote:
    'PDF readers are asked to honor these limits, but some ignore them. Only the password itself truly protects the file.',
  ownerToggle: 'Use a separate password for changing these permissions',
  ownerLabel: 'Permissions password',
  ownerHint: 'Without one, a random password is set. Most PDF readers then keep the limits, but anyone who can open the file can remove them with the right tool.',
  ownerSame: 'Use a different password from the one that opens the file.',
  action: 'Protect PDF',
  outputSuffix: 'protected',
  errors: {},
};
