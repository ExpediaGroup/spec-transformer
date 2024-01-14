module.exports = {
  branches: ['main', 'test'],
  plugins: [
    ['@semantic-release/commit-analyzer', {
      preset: 'conventionalcommits',
      releaseRules: [
        { type: 'feat', release: 'minor', section: 'Features' },
        { type: 'fix', release: 'patch', section: 'Bug Fixes' },
        { type: 'chore', release: 'patch', section: 'Other Updates' },
        { type: 'refactor', release: 'patch', section: 'Other Updates' },
        { type: 'docs', release: 'patch', section: 'Other Updates' },
        { type: 'no-release', release: false }
      ],
      parserOpts: {
        noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES', 'BREAKING-CHANGE', 'BREAKING']
      }
    }],
    ['@semantic-release/release-notes-generator', {
      preset: 'conventionalcommits',
      parserOpts: {
        'noteKeywords': ['BREAKING CHANGE', 'BREAKING CHANGES', 'BREAKING']
      },
      writerOpts: {
        commitsSort: ['subject', 'scope']
      }
    }],
    ['@semantic-release/changelog', {
      'changelogFile': 'CHANGELOG.md'
    }],
    '@semantic-release/npm',
    '@semantic-release/github',
    ['@semantic-release/git', {
      assets: [
        'package.json',
        'CHANGELOG.md'
      ]
    }],
    [
      '@semantic-release/exec',
      {
        successCmd: 'sh ./scripts/update-assets.sh'
      }
    ]
  ]
};
