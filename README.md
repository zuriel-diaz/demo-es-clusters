# ElasticSearch Infra

This project contains the EleasticSearch IaaC source code, handled by the AWS CDK. Also, we have two lambda runtimes: JS & Python.

## Infrastructure Deployment

Note.-We'll need to install the CDK dependencies by running one of the following commands:

```
npm i
```

or

```
npm install -g aws-cdk
```

### Steps

1. Build the app (Optional):

```
npm run build
```

2. List the stacks to verify everything is working correctly:

```
cdk ls
```

3. Synthesize an AWS CloudFormation template:

```
cdk synth
```

4. Deploy the stack:

```
cdk deploy
```

5. In case, you added a last-minute change to your stack, run the following command to see these changes:

```
cdk diff
```

## Tests

1. Go to the `/lambda/python` directory:

```
cd ./lambda/python
```

2. Build the Docker Container

```bash
# build the project
docker-compose build
```

3. Run the Tests

```bash
# run tests
docker-compose run es-sync test

# run tests within directory
docker-compose run es-sync test --name test/subfolder/

# run tests for specific file
docker-compose run es-sync test --name test/test_sync_keywords.py

# run tests and show log messages with INFO or higher
docker-compose run es-sync test --test-log-level INFO
```

## Questions or contributions

Find us in the `#falcon-dev-chat` slack channel.
# demo-es-clusters
