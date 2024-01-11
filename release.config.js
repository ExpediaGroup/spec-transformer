module.exports = {
  branches: ['main'],
  plugins: [
    ['@semantic-release/commit-analyzer', {
      preset: 'conventionalcommits',
      releaseRules: [
        { type: 'docs', scope: 'README', release: 'patch', section: 'Other Updates' },
        { type: 'refactor', release: 'patch', section: 'Other Updates' },
        { type: 'chore', release: 'patch', section: 'Other Updates' },
        { type: 'chore', section: 'Other Updates' },
        { scope: 'no-release', release: false }
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
      message: '${nextRelease.version} CHANGELOG [skip ci]\n\n${nextRelease.notes}',
      assets: [
        'package.json',
        'CHANGELOG.md',
        'LICENSE',
        'README.md',
        'CONTRIBUTING.md',
        'dist/**/*',
        'src/**/*'
      ]
    }]
  ]
};
