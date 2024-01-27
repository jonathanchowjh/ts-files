set -e
GREEN='\033[0;32m'
NC='\033[0m'

printf "${GREEN} Enter Commit Message: ${NC}\n"
read cmd

git add .
git commit -m "$cmd"
git push