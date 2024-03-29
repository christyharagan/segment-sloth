# Segment Sloth

This project currently has two main features:

 A [package manager](#sloth-package-manager) that enables easy consumption of Segment functions into your workspace and a development toolkit for easily building Segment functions.

The development toolkit enables development and testing of [Segment](https://segment.com/) functions ([source](https://segment.com/docs/connections/sources/source-functions/) and [destination](https://segment.com/docs/connections/destinations/destination-functions/)) locally and in your choice of TypeScript or JavaScript. Features

 - Develop in your choice of TypeScript or JavaScript
 - When choosing TypeScript, enable fully typed development against tracking plans
 - Debug your functions from within your IDE, including initiating source-function runs from external URL calls (to test against your actual service providers), or initiating destination-function runs from the Segment UI (to enable easy testing with events collected by Segment)
 - Test your functions locally (for automated unit/functional testing)
 - Deployment of functions from the command line, programmatically, or via a GitHub action for auto deploy upon a push to GitHub
 - NPM package support for functions

Table of Contents
=================

 * [Sloth Package Manager](#sloth-package-manager)
 * [Function Development Requirements](#function-development-requirements)
 * [Quick Start](#quick-start)
 * [Manual](#manual)
   * [Initialise a new project](#initialise-a-new-project)
   * [Build your function](#build-your-function)
   * [Debug your function](#debug-your-function)
   * [Test your function](#test-your-function)
   * [Deploy your function](#deploy-your-function)

## Sloth Package Manager

The sloth package manager (SPM) enables organisations to easily consume functions built by using Segment Sloth.

## Function Development Requirements

These are requirements if you intend to build Segment functions using Sloth.

 - [Node](https://nodejs.org/) v12 or above
 - [AWS-SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
 - (optional) [TypeScript](https://www.typescriptlang.org/)
 - (optional) [Nodemon](https://nodemon.io/), for automatically updating debug/test environments on code change
 - (optional) [Ngrok](https://ngrok.com/), for opening up a URL to your local machine so your function can be called by your service whilst tested locally.
 - (optional) [Jest](https://jest.io/), for running the tests (this is the default framework used, but any testing framework will work)
 - (optional) [Visual Studio Code](https://code.visualstudio.com/), for editing your functions (any editor will suffice, but debug configurations are automatically generated for VSCode. You'll need to create your own configuration for other editors)
 - (optional) [AWS Toolkit for VSCode](https://aws.amazon.com/visualstudiocode/), for running the debug sessions inside VSCode
 - (optional) [vscode-jest](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest), for running the Jest tests inside VSCode

## Quick Start

Install the command-line utility:

```
npm i -g segment-sloth
```

Create a new folder for your new function

```
mkdir my-test-function
cd my-test-function
```

Initalise a new project (and see the Detailed Usage Guide below for details on the init wizard)

```
sloth init
```

Edit the settings for your function ```src/settings.js``` (for JavaScript), or ```src/function.ts``` (for TypeScript).

Edit your function ```src/function.js``` (for JavaScript), or ```src/function.ts``` (for TypeScript)

Edit your debug test code ```src/tests/debug.js``` (for JavaScript), or ```src/tests/debug.ts``` (for TypeScript)

Edit your tests ```src/tests/test.js``` (for JavaScript), or ```src/tests/test.ts``` (for TypeScript)

From within your IDE, launch a new debug session. If using Visual Studio Code, a debug launcher is set-up. Go to Debug and select "Debug Function". You can set break-points in your function code.

Deploy your code to Segment

```
sloth deploy
```

## Manual
### Initialise a new project

First create a folder to house your project. Inside that folder run the command:

```
sloth init
```

This command has various options. To see details on these, run

```
sloth init --help
```

In the root of the folder a file called ```sloth.yaml``` is generated. This is where all the settings for the project are saved, and can be edited later. This yaml file can also be used to generate new projects from the same settings (see run ```sloth init --help``` for details)


### Build your function

The project initialisation creates several files that can be edited:

 * ```src/function.{js,ts}```: This contains the actual code for the function
 * ```src/settings.{js,ts}```: This is where the settings for the functions are defined. See the [section on settings](#settings) for more details
 * ```src/tests/debug.{js, ts}```: This is useful for quickly launching your function locally as part of development testing
 * ```src/tests/tests.{js, ts}```: This is an example of a test suite (using mocha) for running automated tests
 * ```src/tests/payload.{js, ts}```: This contains a sample payload for testing your function locally

Only the ```function``` and ```settings``` files are required and must not be renamed. The other files are optional and are provided only as an example of how to build up useful development assets. You a free to rename them, move them, use different frameworks, etc.

If you chose TypeScript for your language, you will be presented with the option to choose a tracking plan from your workspace from which type definitions for your identify/group/track calls will be strongly typed. If you selected a tracking plan, you can update these typing definitions by running

```
sloth sync_tp
```

#### NPM Dependencies

Your tests and debug launch functions may have any dependencies they require. Just install them as usual.

Your function may have dependencies but there are restrictions. By default several are already installed. These include:

 * ```fetch``` which is just a global function available
 * ```atob```
 * ```btoa```
 * ```crpyto``` this is a node package; other node packages are not allowed
 * ```xml```
 * ```oauth```
 * ```lodash```

You may install other dependencies but they may not depend on any node package other than ```crpyto```. It's probably safest to assume an npm package that can run in the browser (assuming it doesn't use browser only functions/features) will work. 

The easiest way to check is to run

```sloth check_deps```

If it runs with no errors, you're good to go. Under the covers, it uses Webpack to compile the dependencies into a single deployable unit

#### Settings

_*IMPORTANT*_ : Names for settings must be in [camel case](https://en.wikipedia.org/wiki/Camel_case)

The settings config file contains two variables:

 * ```RequiredFunctionSettings``` for settings that must be filled in
 * ```OptionalFunctionSettings``` for settings that may be filled in

An example would be:

```ts
const RequiredFunctionSettings = {
  apiKey: string,
  password: secret,
  isAwesome: {type: boolean, description: 'A boolean setting'},
  waysInWhichItsAwesome: array,
  aMapSetting: map
}
const OptionalFunctionSettings = {
  optionalString: string,
  optionalPassword: {type: secret, description: 'A password setting'}
}
```

 They are both javascript maps. The key for each property will be the setting name (you can use quotes for names with spaces) and the value will be one of

 * ```string``` for string values
 * ```secret``` for encrypted and starred out values
 * ```boolean``` for boolean values
 * ```array``` for arrays of strings
 * ```map``` for a map of strings
 * An object that looks like: ```{type: string, description: 'Some description'}```. This is for providing descriptions with the corresponding setting

### Debug your function

There are three modes for debugging:

 * ```local```: functions are called from on your local machine.
 * ```remote```: functions are called via a publicly avaiable url. This is great for testing your source functions against your actual source provider
 * ```segment```: functions are called via the Segment Function test UI. A function will be uploaded your Segment workspace, but this just calls out to the public url. It will finish or timeout from a Segment perspective, so once the function is launched, ignore the Segment UI and instead use this solely to debug your function locally.

If debugging locally, use the debug functionality from within VS Code.

To run the others, from the command line, first launch the debug instance:

```
sloth debug remote
sloth debug segment
```

This launches a local AWS-SAM instance that will house your function. If you are developing against TypeScript (and you have nodemon installed), then it will also automatically compile your TypeScript for you, so no re-launches are required.

If you choose to use ngrok on project init and are running the remote option, the above command will also display the public url you can test your function against.

### Test your function

Tests are only run locally (unlike debug which supports other modes). By default you can run local tests by running (from the root project folder) for JavaScript and TypeScript:

```
jest
```

As mentioned above, tests are done against the code that will be deployed Segment and the test environment is configured to match the Segment environment. However, to be 100% sure your code will run as expected, it is strongly recommended you deploy your code to Segment, and run the functions there as a final test step.

### Deploy your function

There are three options here:

 * From the command line via ```sloth deploy``` (type ```sloth deploy --help``` for details)
 * Programmatically via ```import {deploy} from 'segment-sloth'```
 * As part of a GitHub hook on commit. See the [Sloth GitHub Action](https://github.com/christyharagan/sloth-github-action) for details. The standard project initalisation adds the necessary workflow file (```sloth.yaml```) in your ```.github/workflow``` directory to support this

Finally, an option to just create a file and deploy manually (good for handing code to clients who don't use Sloth) is to run

```sloth deploy --out_file=my_fn_code.js --pretty```

(Note: The use of ```--pretty``` is optional; it creates human readable code output, BUT module imports cannot be used with this option. If you use module imports, skip this option and you'll have to settle with non-human readable code)
