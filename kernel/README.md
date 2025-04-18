# Unternet Kernel

The Unternet Kernel package contains a collection of useful modules for constructing an LLM kernel, used for responding to input and orchestrating actions in a client.

## Getting started

```
npm install
npm build
```

To try out the example project:

```
npm run example
```

## Concepts

The main entrypoint for the kernel is the `Interpreter` class, which is passed a model, a set of `Resource` objects, a hint, and other parameters to set itself up. `Interpreter` acts as the main cognitive processing unit for the kernel. When given an input, it will respond with one or more outputs which can look like text outputs (`TextOutput`), or actions to take (`ActionOutput`). You can then use the `Dispatcher` class to handle those actions.

Actions are derived from `Resources`. A resource is anything that a model might use to get information or perform an action in response to an input. All resources must have a URI, which is a string that adheres to [RFC3986](https://datatracker.ietf.org/doc/html/rfc3986), an internet standard. For example, the following are valid URIs:

- https://my-applet.example.com/
- mcp:some-mcp-server-identifier
- function:system
- file:///Users/username/my-file.txt

Actions are grouped under resources, to support use cases where you might have many actions being authored together. This is an emerging pattern with LLM tools (see: MCP, Web Applets).

Each URI is handled by a `Protocol`, which corresponds to the given URI scheme (e.g. `http`, `mcp`, etc.). You can register protocols with `Dispatcher`, then dispatch any action from `Interpreter` and you will get a response object that corresponds to the output of that action.
