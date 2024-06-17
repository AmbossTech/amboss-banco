#!/bin/bash

if [ -v AMBOSS_ADD_ENVS ]; then
    aws s3 cp s3://amboss-envs/$ENV/$SERVICE/.env .
fi

# Start server
node server.js