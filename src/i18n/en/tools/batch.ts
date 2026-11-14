export default {
  title: 'Batch PDF',
  metaTitle: 'Batch process PDFs in your browser | LeafLock PDF',
  metaDescription:
    'Compress, protect or flatten many PDFs in one go, without uploading any of them. Everything runs on your device.',
  summary: 'Run the same job over many PDFs at once, without doing them one by one.',
  howTo: [
    'Choose the job you want: compress, protect or flatten.',
    'Add all the PDFs you want it applied to.',
    'Select Run on all files, then download them together as a ZIP.',
  ],
  faq: [
    {
      q: 'How many files can I do at once?',
      a: 'There’s no fixed limit. Files are processed one after another so your device doesn’t run out of memory, which means a large batch takes a while but gets through.',
    },
    {
      q: 'What happens if one file fails?',
      a: 'The rest carry on. Any file that can’t be processed, for example because it needs a password, is marked in the list with the reason, and the others still finish.',
    },
    {
      q: 'Does a batch use up my daily limit quickly?',
      a: 'No. A whole batch counts as one job, however many files are in it.',
    },
    {
      q: 'Are the files uploaded?',
      a: 'No. As with every tool here, each file is processed by your own browser and never leaves your device. The page is blocked from sending them anywhere.',
    },
  ],

  jobLabel: 'Job',
  jobs: {
    compress: 'Compress',
    protect: 'Protect with a password',
    flatten: 'Flatten',
  },
  levelLabel: 'How much to compress',
  levels: {
    light: 'Light',
    recommended: 'Recommended',
    strong: 'Strong',
  },
  passwordLabel: 'Password to open the files',
  passwordHint: 'The same password is set on every file in the batch.',
  annotationsLabel: 'Also flatten comments and highlights',

  action: 'Run on all files',
  working: 'Working…',
  needFiles: 'Add at least two PDFs to run a batch.',
  needPassword: 'Enter a password first.',

  status: {
    waiting: 'Waiting',
    working: 'Working…',
    done: 'Done',
    failed: 'Failed',
  },
  someFailed: {
    one: '{count} file could not be processed and was left out.',
    other: '{count} files could not be processed and were left out.',
  },

  /** Codes the batched operations can raise, so a row explains itself instead of
   * falling back to "something went wrong" and being reported as a bug. */
  errors: {
    'nothing-to-flatten': '{name} has no form fields or annotations to flatten.',
  },
  suffix: {
    compress: '-smaller',
    protect: '-protected',
    flatten: '-flat',
  },
};
