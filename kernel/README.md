# Unternet Kernel

The Unternet Kernel package contains a collection of useful modules for constructing an LLM kernel, used for responding to input and orchestrating actions.

Key components:

- `interpreter`: the main entrypoint, which handles user input & output
- `interactions`: defines the `Interaction` model & helper functions which structure the input & output data format
- `dispatcher`: handles dispatching actions to protocol handlers, and returning their outputs
- `resources`: defines the `Resource` model & helper functions to keep track of resources & tools the model can use in its responses

The Kernel should be decoupled from the exact internals of the application, databases, etc.
