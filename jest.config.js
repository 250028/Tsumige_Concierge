const nextJest = require('next/jest')

// next/jest が Next.js の設定（SWC・パスエイリアスなど）を読み込んでJestに反映してくれる
const createJestConfig = nextJest({ dir: './' })

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', '<rootDir>'],
}

module.exports = createJestConfig(customJestConfig)
