# Setting up global choice stats (one-time, ~10 minutes)

The game can show real, live statistics of how *every* player who has ever
played has answered each choice ("64% chose to report it to HR"). This
needs a small free cloud database (Firebase Firestore) behind it. Until you
do this setup, that section of the ending screen just stays empty — nothing
else about the game is affected.

You only need to do this once. No coding required.

## 1. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
   and sign in with any Google account.
2. Click **Add project**, give it any name (e.g. "geworld-vn"), and finish
   the wizard (you can disable Google Analytics — not needed here).
3. This uses Firebase's free "Spark" plan, which is more than enough for a
   project like this.

## 2. Turn on Firestore (the database)

1. In the left sidebar, click **Build → Firestore Database**.
2. Click **Create database**.
3. Choose **Start in production mode** (not test mode — we'll paste in our
   own rules in step 4, which are what actually secures the data).
4. Pick any region close to your players and click **Enable**.

## 3. Register a "web app" to get your config

1. Click the gear icon next to "Project Overview" → **Project settings**.
2. Scroll to **Your apps** → click the `</>` (web) icon.
3. Give it any nickname (e.g. "geworld-web") and click **Register app**.
   You don't need Firebase Hosting — skip that step.
4. You'll see a code block that looks like this:
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "geworld-vn.firebaseapp.com",
     projectId: "geworld-vn",
     storageBucket: "geworld-vn.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef123456"
   };
   ```
5. Open [js/firebaseConfig.js](js/firebaseConfig.js) in this project and
   replace the placeholder `'REPLACE_ME'` values with the real ones from
   that code block. Save the file — that's the only code change needed.

   (Yes, it's fine that this file gets committed/shared — Firebase's own
   docs confirm this web `apiKey` isn't a secret. What actually protects
   your data is the security rules in the next step.)

## 4. Publish the security rules

1. Back in **Firestore Database**, click the **Rules** tab.
2. Delete whatever's there and paste this in exactly:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /sceneChoices/{sceneId} {
         allow read: if true;
         allow create: if request.resource.data.keys().hasOnly(['choice_0','choice_1']) &&
                          (!('choice_0' in request.resource.data) || request.resource.data.choice_0 is int) &&
                          (!('choice_1' in request.resource.data) || request.resource.data.choice_1 is int);
         allow update: if request.resource.data.diff(resource.data).affectedKeys()
                          .hasOnly(['choice_0','choice_1']);
         allow delete: if false;
       }
     }
   }
   ```

3. Click **Publish**.

These rules let anyone read the totals (needed to show the percentages) and
increment the two choice counters per scene, but nobody can delete data or
write anything outside those two fields. `choice_0` / `choice_1` cover
every scene in this project since no scene currently offers more than 2
choices — if a future scene ever adds a 3rd option, add `'choice_2'` to
both `hasOnly([...])` lists above and republish.

## 5. Test it

1. Serve the game locally (see the main README) and play through to any
   ending. You shouldn't see any errors in the browser console.
2. In the Firebase console, go to **Firestore Database → Data** — you
   should see a `sceneChoices` collection appear with a document per scene
   you made a choice in.
3. Play through again with a different choice, reach an ending again — the
   "how other players chose" section should now show percentages reflecting
   both playthroughs.

## Good to know

- This is client-trust data: anyone technically capable could send extra
  increments directly to Firestore without playing the game (the rules stop
  them from writing anything *else*, but not from padding these two
  counters). That's an acceptable tradeoff for a project like this; it's
  not meant to be tamper-proof analytics.
- The free Spark plan covers roughly 50,000 reads and 20,000 writes a day —
  far more than this project is likely to need.
