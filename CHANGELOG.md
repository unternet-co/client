# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Changes prior to changelog introduction

- Change build system & folder structure to build entire app & html together (not have a separate web server)
- Add model layer, for efficient in-memory storage, and separate from persistence services
- Make Kernel truly modular & without dependence on the main app code
