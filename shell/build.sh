set -e
rimraf dist
npm run lint
tsc --module commonjs
