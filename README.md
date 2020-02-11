# Data Anonymization Tool

* What does this project do? **TODO**

In this project, we envision a tool that could help users manage voice data responsibly. A user can use it to identify parts of the speech that are privacy related and take actions to anonymize them. Some potential features we have brainstormed include allowing users to define different levels of privacy concerns and label data accordingly, editing features that enable users to cut or mask sensitive information, or implementing voice changing features that could modify the speaker acoustic attributes to make it unrecognizable.

* Why people should consider using your project? **TODO**

* [Link to project home page](https://github.com/nitinsaroha/anonymization-tool)

## Table of Contents

1. [About the Project](#about-the-project)
1. [Project Status](#project-status)
1. [Getting Started](#getting-started)
    1. [Dependencies](#dependencies)
    1. [Installation](#installation)
    1. [Usage](#usage)
1. [Release Process](#release-process)
    1. [Versioning](#versioning)
1. [How to Get Help](#how-to-get-help)
1. [Further Reading](#further-reading)
1. [Contributing](#contributing)
1. [License](#license)
1. [Authors](#authors)
1. [Acknowledgements](#acknowledgements)

## About the Project

Here you can provide more details about the project
* What features does your project provide?
    * User Login
    * Audio Upload (Stores audio in Google Cloud Storage) and Play Feature
    * Automatic Speech-to-text transcription on audio file Upload (Supports Linear16 encoding only) using Google Cloud Platform
    * Stores Audio metadata and transcript in Firebase Firestore
    * Read Transcripts of audio from Firestore
    * **TODO**

* Short motivation for the project? (Don't be too long winded)

January first of 2020 was also the date when California Consumer Privacy Act took effect. This is a significant milestone for privacy protection. California was the first state in US to enact such a law. Many observers believe it will set an example for other states to follow, which will lead to some actions at the federal level. In Europe, there is a similar law called General Data Protection Regulation that has taken effect on May 25, 2018. These two laws make impossible for successful business not to think about the complex legal and practical context in which they deal with user information. While both laws lend much focus on how to obtain and manage consents, in real life privacy decisions are often decisions on trade-offs. How much risk do I get myself into by sharing my information? What can I get out of by sharing my information? How a company handles your data can persuade you to share more or less about yourself. So, being able to anonymize data properly will become a critical requirement.

Anonymizing data is not as simple as it may sound. Even with text-based data, we need to think about identifiable information, such as one’s name, gender, address, phone number, but also sensitive information, such as one’s religious belief or political affiliation. And there are also tricky details, such as a unique experience, that could reveal one’s identity to some people. With the success of a lot IoT devices,we now face greater challenges with audio, video, or biometric data.


* Links to the project site **TODO**
* Links to other Docs

```
Show some example code to describe what your project does
Show some of your APIs
```

**[Back to top](#table-of-contents)**

## Project Status

Show the build status if you have a CI server:

[![Build Status](http://your-server:12345/job/badge/icon)](https://your-server:12345/job/http://your-server:12345/job/badge/icon/)

Describe the current release and any notes about the current state of the project. Examples: currently compiles on your host machine, APIs are not set, feature not implemented, etc.

**[Back to top](#table-of-contents)**

## Getting Started

This section should provide instructions for other developers to

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

## Dependencies

Describe what software and libraries you will need to install in order to build and use this project. Provide details on how to resolve these dependencies.

1. #### Node.js
2. #### [Sign Up Firebase](https://console.firebase.google.com/) using your Google Account (Free Firebase Account)
3. #### Firebase Functions
    3.1 Listens for audio upload on Google Cloud Storage Bucket.

    3.2 Transcribes audio using Google Speech-to-Text and update the result on Firebase Sirestore

## Getting the Source

This project is [hosted on GitHub](https://github.com/nitinsaroha/anonymization-tool). You can clone this project directly using this command:

```bash
git clone https://github.com/nitinsaroha/anonymization-tool.git
```

## Installation

Put your firebase credentials to `.env`.

.env file should look like this

```
REACT_APP_FIREBASE_KEY=""
REACT_APP_FIREBASE_DOMAIN=""
REACT_APP_FIREBASE_DATABASE=""
REACT_APP_FIREBASE_PROJECT_ID=""
REACT_APP_FIREBASE_STORAGE_BUCKET=""
REACT_APP_FIREBASE_SENDER_ID=<>
```

Next steps

```bash
cd anonymization-tool
# Install the dependencies
npm install
# Initialize the firebase project using your own credentials
firebase init

# Install Firebae functions dependecies
cd functions/
npm install
```

## Usage

Instructions for using your project. Ways to run the program, how to include it in another project, etc.

1. This project uses various Firebase Products for Cloud First Engineering
    * Firebase Authentication - (For login end users)
    * Firebase Firestore - (NoSql Database)
    * Firebase Storage - Audio Storage
    * Firebase Functions
    * Firebase Hosting (Optional)
2. React

```bash
# Start the react app
npm start
```

If your project provides an API, either provide details for usage in this document or link to the appropriate API reference documents

**[Back to top](#table-of-contents)**

## Running Tests TODO

Describe how to run unit tests for your project.

If you have formatting checks, coding style checks, or static analysis tests that must pass before changes will be considered, add a section for those and provide instructions
```
Examples should be included
```

## Release Process

Talk about the release process. How are releases made? What cadence? How to get new releases?

## Versioning

We will use [Semantic Versioning](http://semver.org/). For a list of available versions, see the [repository tag list](https://github.com/your/project/tags).

**[Back to top](#table-of-contents)**

## How to Get Help

Provide any instructions or contact information for users who need to get further help with your project.

## Contributing

Provide details about how people can contribute to your project. If you have a contributing guide, mention it here. e.g.:

We encourage public contributions! Please review [CONTRIBUTING.md](docs/CONTRIBUTING.md) for details on our code of conduct and development process.

**[Back to top](#table-of-contents)**

## Further Reading

Provide links to other relevant documentation here
1. Google Speech to text - https://cloud.google.com/speech-to-text/docs
2. Google Firebase - https://console.firebase.google.com
3. React - https://reactjs.org/

**[Back to top](#table-of-contents)**

## License

This project is licensed under the MIT License - see [LICENSE.md](LICENSE.md) file for details.

**[Back to top](#table-of-contents)**

## Authors

* **[Nitin Saroha](https://github.com/nitinsaroha)** - *Initial work*

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

**[Back to top](#table-of-contents)**

## Acknowledgments

Provide proper credits, shoutouts, and honorable mentions here. Also provide links to relevant repositories, blog posts, or contributors worth mentioning.

Give proper credits. This could be a link to any repo which inspired you to build this project, any blogposts or links to people who contributed in this project. If you used external code, link to the original source.

README Template Source - [Embedded Artistry](https://github.com/embeddedartistry/embedded-resources)

Firebase Authenctication Example in React - [Link to Github](https://github.com/satansdeer/react-firebase-auth)

**[Back to top](#table-of-contents)**
