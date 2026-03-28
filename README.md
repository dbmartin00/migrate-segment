## Harness Segment Migration

Moving segments from an outside source to Harness FME?  

This tool is a building block to success.

![Segment Migration](https://images.unsplash.com/photo-1543465077-db45d34b88a5?q=80&w=765&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D "Segment Migration")


## What is it?

A sample script showing segment migration.  Source data is only in dummy form, so coding is required to complete the job.

A node.js script that takes no arguments, and an environment variable config:

```
export HARNESS_API_KEY=
export WORKSPACE_ID=
export ENVIRONMENT_ID=
export TRAFFIC_TYPE=user
```

You must have an admin account API key with the following privilege to make the **sat.***  key, privilege:

 - FME Administrator

The WORKSPACE_ID is in the URL when you are usign FME, look for /ws/<long id>

ENVIRONMENT_ID must be full "coded ID" with Project in FME console

Unless you know you're using a custom traffic type, choose "user" as shown.

## How do I run it?

Make sure your environment variables are flushed to the shell, with "source <env>"

bash
```
source env # your four environment variables in an env file, setting discussion above.
npm install
node migrate-segment.js
```

The default script creates three sample JSON segments from files in a src/ directory argument.

## How does it work?

There are four key steps that show as numbered green checks in the logging:

 1. Delete the segment if it exists
 2. Create a new segment
 3. Enable segment in your environment
 4. Upload keys to your segment

The deletion clears the deck for a fresh segment.  This may not be desired behavior.  A "skip cache" of finished segments could be implemented.  This approach takes a clean slate to each segment.

Segments are not ready for keys on creation. They may need to be enabled in an environment, step three.

The final uploadKeys step pushes keys to segment, 10,000 at time up to 100,000 .  Larger segments should be handled manually.

``` json
{"keys":["id1", "id2", "id3"], "comment":"a migrated segment"}
```

Repeated for each segment.

Keys should be JSON imported from external source.  Use the included src directory and JSON color files for reference.

## Notes

The back end can't handle too many expensive segment changes at once.  The tool is throttled.   At ten seconds per segment, the tool is consistently successul.  Lowering or removing the throttle will have bad results.



## Tools

**cleanup.js** will delete one segment at time to assist with testing.

## Author

david.martin@harness.io

