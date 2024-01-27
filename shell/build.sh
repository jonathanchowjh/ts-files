set -e
rimraf dist
npm run lint
npm run test
tsc --module commonjs
