# Processes

## Lifecycle

`ProcessContainer` handles lifecycle for a process.

A process can have `idle`, `running` or `suspended`.

You can protect any process from hibernation by setting `discardable = false`. Use this sparingly, for example, when you have something that is pinned open.

Hibernation is done by first-in-first-out. You can disable this automatic memory management by setting `processLimit = null`.
