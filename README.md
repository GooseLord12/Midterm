# ActionVault Project Description:

ActionVault helps collectors organize, track, and showcase their action figure collections. Whether you collect vintage Star Wars figures, Marvel Legends, model kits, or any other line, ActionVault gives you a central place to manage it all! Be it updating figure listings/conditions, sorting through your collection or simply building your own wishlist, these are but some of ActionValuts features that can all be operated within the app and ActionValut's sleek, yet impactful UI will alow users to navigate these components with ease.

## ActionVault Features:

- Add and edit action figures in your collection
- Upload photos for each figure
- Track condition, value, and purchase details
- Search and filter your collection
- Wishlist tracking

## Tech Stack:

- HTML, CSS, JavaScript
- Additional assistance provided by Claude Code

## Set-Up Instructions:

Option 1: View the Live Site:
1. Visit the fully-deployed app on Netlify:
That's it, as simple as that!


Option 2: Run locally:
1. Clone the repositor:
git clone https://github.com/GooseLord12/DIG4503-Week8.git
2. Open index.html in any modern browser
There are no dependencies, servers, or build tools required with data being stored in localStorage

## Bugs/Limitations

- localStorage has storage limitations and clearing the browser data deletes the entire collection
- No user account as of yet
- No export/import as of yet
- No sorting as of yet, figures can be searched and filtered but sorting by name, date added, value, etc. has yet to be implemented
- No shareable URL for collection or wishlist
- Image handling is not optimized to be stored as a server-based upload, low-resolution uploading loclally

## What I Learned?

Through this Midterm Project of developing ActionVailt, although I had been working through the iteration process over the past 4-5 weeks on various projects, I truly learned how impactful iterative coding and instruction is in order to fully get a grasp on understanding the code that is being generated as well as bugs and broken code especially on a large-scale project such as this. For example, by taking the time to iteravely revisit what Claude had suggested by asking to test the code that had been delivered and ask clarifying questions, I was able to discover that JavaScript was indeed treating the numerical value of 0 as a faulty value which was resulting in missing prices ($0.00) and ultimatley discoved the proper way to format my syntax to avoid this little quirk. I wanted to provide specific example of this but in a general sense, being able to think through decisions made by Claude and push-back or ask for clarification has allowed me to become a stronger developer who can properly apply these concepts and learnings to other projects. Additionally, I've also learned how to manage working on a larger-scale project over multiple sessions and how to pick up and seamlessly continue after prolonged breaks. A combination of saved transcripts (believe me, I probably oversaved just so I wouldn't lose any information) and refreshing hsitroy in the terminal truly kept me on track and helped me deliver a seamless project over a longer development period without a headache and made streamlining my development incredibly easy.