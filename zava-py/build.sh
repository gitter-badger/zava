#!/bin/bash

DOCKER_FILE=Dockerfile
DOCKER_REPO=zava
DOCKER_TAG=local
AAPI_VERSION=version
APYPI_REPO=repo

while getopts v:r: option
do
  case "${option}"
  in
  v) AAPI_VERSION=${OPTARG};;
  r) APYPI_REPO=${OPTARG};;
esac
done

if [[ "version" == AAPI_VERSION || "repo" == $APYPI_REPO ]]; then
  echo "Usage: ./build.sh -r [pypi|testpypi] -v [version]"
  echo "     -r repository, pypi or testpypi"
  echo "     -v version e.g. 0.2.5"
else
  docker build --no-cache \
    -f $DOCKER_FILE \
    --build-arg AAPI_VERSION=$AAPI_VERSION \
    --build-arg APYPI_REPO=$APYPI_REPO \
    -t ${DOCKER_REPO}:${DOCKER_TAG} .
fi