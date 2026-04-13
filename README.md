## Harness Segment Copy and Migration

Moving segments from an outside source to Harness FME?  Moving from one Harness FME Project to another?  This set of tools is useful for moving segment data.

If you are migrating from another tool, this tool is a building block to success.  You must still extract and copy segments, in the expected JSON schema, to use this tool to load the segments.

If you are copying from one project to another, this will will extract the segment data and allow you to load it to a new Project in two separate steps.

## INVENTORY
```
export HARNESS_API_KEY=sat.** 
export WORKSPACE_ID=<from FME admin settings console>
export ENVIRONMENT_ID=<from FME admin settings console>
export TRAFFIC_TYPE=user
```

YOU WILL NEED TO SWAP OR CREATE NEW NEW ENVIRONMENT VARIABLES, AT LEAST FOR WORKSPACE AND ENVIRONMENT, WHEN YOU GO FROM dump-segments.js (SOURCE) SEGMENTS TO migrate-segment.js (DEST).

When you create an admin level API key, it should be able to read from both projects/workspaces.

**dump-segments.js**
  Exports all segments (and their keys) from Harness FME/Split to local JSON files.  Each file is named {segmentName}.json and matches the schema expected by migrate-segment.js.

**migrate-segment.js**
  Migrates segments from JSON source to a target Harness FME project and environment.

**generate.js** - generate a segment with 10,000 keys, for testing
**cleanup.js** - delete a segment
**blast.js** - delete all segments (danger!)

##

Read on past the parking lot for the details.

![Segment Migration](https://images.unsplash.com/photo-1543465077-db45d34b88a5?q=80&w=765&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D "Segment Migration")


You must have an admin account API key with the following privilege to make the **sat.***  key, privilege:

 - FME Administrator

Find IDs using the admin settings console in the UI.

Unless you know you're using a custom traffic type, choose "user" as shown.

## How do I run it?

Make sure your environment variables are flushed to the shell, with "source <env>"

bash
```
source env # your four environment variables in an env file, setting discussion above.
npm install
node migrate-segment.js src/
```

The default script creates three simple JSON segments and a bulk 10,000 key segment. The files are in the src/ directory.

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

**blasts.js** deletes all eligible segments!!! CAUTION!!!

**generate.js** makes a 10,000 key segment for testing.

## Author

david.martin@harness.io

