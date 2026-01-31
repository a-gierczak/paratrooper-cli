# Paratrooper CLI

A command line utility to interact with and manage Paratrooper.

## Installation

```sh
npm install -g @paratrooper/cli
```
## Usage

Create paratrooper.json config file for your React Native (or Expo) project:

```sh
ota init
```

Push a new update:

```sh
ota update
```

Rollback a previously published update:

```sh
ota rollback <updateId>
```

List all updates:

```sh
ota list # or ls
```

