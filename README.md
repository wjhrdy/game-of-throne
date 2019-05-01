# Game of Throne

## Architecture
This project consists of the following aspects:
- An S3 Bucket, configured to serve static pages
- AWS Lambda functions linked by AWS API Gateway to act as endpoints
- The Raspberry Pi attached to the stall.
- CloudFront and CloudFlare

### S3 Bucket
The S3 Bucket `shower.willygood.site` contains multiple files, the most important two of which are index.html and "state".

- **index.html** -- The file served to the user when they hit https://shower.willygood.site.  Pulls in data from "state" and displays it to the user.
- **statethree/statefour** -- File containing a JSON blob of the state of the shower.  Currently only has "State" and "UpdatedDate".
- **last_updatedthree/last_updatedfour** -- File containing a JSON blob of the last update of the shower.  Currently only has "State" and "UpdatedDate".

These files are housed within the /static/ directory of this git repository.

### AWS Lambda functions with API Gateway
Rather than starting yet another Heroku server to run pretty minimal code, we opted to use [Serverless](https://serverless.com/).

Serverless is responsible for taking the code in js/handler.js and turning it into a GET endpoint that can be hit to update the "state" file in the S3 bucket.  In short, Serverless creates an S3 bucket to house extra code, an API Gateway endpoint, then attaches that API Gateway to the Lambda function via a Lambda event.

This provides two endpoints hosted at https://XXXXXXXX.execute-api.us-east-1.amazonaws.com:
- /dev/shower/free/{floor}
- /dev/shower/busy/{floor}

Free, naturally, updates the `state{floor}` object to be free, while the `busy` endpoint updates the `state{floor}` object to be busy.  A sample `state{floor}` object has been provided for this purpose.

#### Setup
Setup involves performing the following steps:
1. Ensure that you have [nvm](https://github.com/creationix/nvm/blob/master/README.markdown#installation), [nodejs](https://nodejs.org/en/download/), and [npm](http://blog.npmjs.org/post/85484771375/how-to-install-npm)
2. Run `nvm install` within your `game-of-throne` project directory.
2. Run `npm install serverless -g` to install the Serverless client.
3. Run `npm install` within the your `game-of-throne` project directory.
4. Copy the `sample.env` file to `.env` and fill in your AWS credentials.  If you don't have these, request them from EE Pod.

That's it!  You should be up and running.

#### Making Changes
Lambda works by hosting your code on a dynamically resizing blob of servers that give you control over only your code.  The rest is handled by AWS.  The functions defined in `serverless.yml` are set as handlers, and `events` definitions tie API Gateway endpoints to these functions.

When these are tied together, requests go to the functions in handler.js, and supply an `event`, `context`, and `callback`.  `event` contains everything about the request, including its headers, body, and type.  `context` contains functions and members that pertain to the [current function context](http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html).  `callback` is the function that needs to respond to calls to the client (e.g. the thing that gives a 200 response back, along with headers and a body, if you should so desire).

When adding a new function, ensure that you update the `serverless.yml` to tie a new API Gateway endpoint to it.  Refer to the ones that exist for potential options, as well as the Serverless documentation for even more.

Deploying is as simple as calling the deploy script at `scripts/deploy.sh`, which utilizes your AWS credentials within .env and calls the serverless executable.

### The Raspberry Pi
The RPi is our way of interacting with the physical world.  It's mounted to the bathroom stall door, with one wire attached to a +3.3V GPIO port, and another attached to a GPIO input pin.  The wires are affixed with a gap between them, opposite the door lock rod.  When the lock rod makes contact, it completes a circuit, letting the RPi know that the door lock mechanism has been engaged.

When the lock rod makes contact, a nodejs application running locally on the RPi detects whether or not the GPIO input pin detects a high voltage.  If it does, the nodejs app performs an HTTP GET on the /dev/shower/free endpoint.  Otherwise, it performs an HTTP GET on /dev/shower/busy.

#### Setup
This will all need to be performed on the RPi.

The file structure on the local RPi filesystem is as follows:
- nodejs directory: `/usr/local/shower`

The RPi is currently pointed to the `game-of-throne-raspberry` repo, which no longer exists.  This repo has been merged into the `game-of-throne` repo.  You'll need to first ensure that this step is done before moving forward.

On the RPi, run `npm install`.  You can then run `nodejs index.js` to start the application.  This will start polling pin 24 for a +3.3V input.

##### Autostart
On RPi, run `crontab -e` and paste this at the end of the file
`@reboot sudo nodejs --use_strict /usr/local/shower/index.js &`

#### Making Changes
Simply edit index.js and you'll be up and running!  

### Cloudfront and CloudFlare
S3 doesn't give the ability to serve statically from a bucket with SSL enabled.  The best practice approach for this is to place it behind a Cloudfront endpoint, which can then serve HTTPS based content.

Under normal circumstances, you would simply point your DNS provider at the Cloudfront endpoint and be finished.  However, both Cloudfront and CloudFlare are CDNs, and both try to enable caching accordingly.  This causes issues in two important ways:
- The `state` object will become stale
- CORs issues become a problem if everything is not served from the same origin.

To fix these issues, Cloudfront was put in front of the S3 bucket with very small TTLs, and the ability to serve the OPTIONS request.  Then, a CNAME was added to CloudFlare for canigoyet pointing to the Cloudfront URL, with a Page rule that prevented CloudFlare from performing any caching.  From there, all content is served from CloudFlare under https://shower.willygood.site
