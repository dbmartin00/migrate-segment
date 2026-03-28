## Harness Segment Migration

Moving segments from an outside source to Harness FME?  

This tool is a building block to success.

## What is it?

A node.js script that takes no arguments, and an environment variable config:

```
export HARNESS_API_KEY=
export WORKSPACE_ID=
export ENVIRONMENT_ID=Snow
export TRAFFIC_TYPE=user
```

You must have an admin account API key with the following privilege to make the **sat.***  key, privilege:

 - FME Administrator

The WORKSPACE_ID is in the URL when you are usign FME, look for /ws/<long id>

ENVIRONMENT_ID can be the plain text name of your FME environment (e.g. "Default").

Unless you know you're using a custom traffic type, choose "user" as shown.

## How do I run it?

Make sure your environment variables are flushed to the shell, with "source <env>"

Node.js.
```
npm install
node migrate-segment.js
```

The default script creates ten segments in the environment specified by the environment variables.

## How does it work?

There are four key steps that show as numbered green checks in the logging:

 1. Delete the segment if it exists
 2. Create a new segment
 3. Enable segment in your environment
 4. Upload keys to your segment

The deletion clears the deck for a fresh segment.  This may not be desired behavior.  A "skip cache" of finished segments could be implemented: TODO

Segments are not ready for keys on creation. They need to be enabled an an environment, step three.

The final uploadKeys step pushes keys to segment, 10,000 at time up to 100,000 .  Larger segments should be handled manually.

``` json
{"keys":["id1", "id2", "id3"], "comment":"a migrated segment"}
```

Repeated for each segment.

Keys should be JSON imported from external source.

## Delays

The back end can't handle too many expensive segment changes at once.  The tool is throttled.   At ten seconds per segment, the tool is consistently successul.  Lowering or removing the throttle will have bad results.

## Tools

**cleanup.js** will delete one segment at time to assist with testing.

## Author

david.martin@harness.io

