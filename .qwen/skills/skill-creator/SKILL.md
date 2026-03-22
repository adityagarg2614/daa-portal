---
name: skill-creator
description: Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, edit, or optimize an existing skill.
---

# Skill Creator

A skill for creating new skills and iteratively improving them.

At a high level, the process of creating a skill goes like this:

1. Decide what you want the skill to do and roughly how it should do it
2. Write a draft of the skill
3. Create a few test prompts and run them
4. Help the user evaluate the results both qualitatively and quantitatively
5. Rewrite the skill based on feedback
6. Repeat until satisfied

## Communicating with the User

Adapt your communication style based on the user's technical familiarity:
- For technical users: Use terms like "evaluation", "benchmark", "JSON", "assertion" without explanation
- For non-technical users: Briefly explain technical terms when first used
- Watch for context cues to gauge computer literacy

---

## Creating a Skill

### Capture Intent

Start by understanding what the user wants:

1. What should this skill enable the AI to do?
2. When should this skill trigger? (what user phrases/contexts)
3. What's the expected output format?
4. Should we set up test cases? (Skills with objective outputs benefit from tests; subjective skills often don't need them)

### Write the SKILL.md

A skill consists of:

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description required)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/ - Executable code for deterministic tasks
    ├── references/ - Docs loaded into context as needed
    └── assets/ - Files used in output (templates, icons)
```

**YAML Frontmatter:**
```yaml
---
name: my-skill-name
description: A clear description of what this skill does and when to use it
---
```

**Tips for descriptions:**
- Include both WHAT the skill does AND WHEN to use it
- Make descriptions slightly "pushy" to combat undertriggering
- Example: "How to build dashboards. Use whenever the user mentions dashboards, data visualization, internal metrics, or wants to display company data."

**Writing the skill body:**
- Use imperative form for instructions
- Explain the WHY behind requirements, not just rigid MUSTs
- Keep under 500 lines; add hierarchy if approaching limit
- Reference files clearly with guidance on when to read them

### Test Cases

After drafting, create 2-3 realistic test prompts. Save to `evals/evals.json`:

```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "User's task prompt",
      "expected_output": "Description of expected result"
    }
  ]
}
```

---

## Running and Evaluating Test Cases

### Step 1: Run Test Cases

For each test case, execute the task with the skill active. Save outputs to organized directories:

```
/workspace/iteration-1/eval-0/with_skill/outputs/
```

### Step 2: Review Results

Present results to the user:
- Show the prompt and output for each test case
- For file outputs, save to filesystem and provide the path
- Ask for feedback inline: "How does this look? Anything you'd change?"

### Step 3: Improve Based on Feedback

When improving the skill:

1. **Generalize from feedback** - Create skills that work for many cases, not just test examples
2. **Keep instructions lean** - Remove anything not pulling its weight
3. **Explain the why** - LLMs perform better when they understand reasoning
4. **Look for repeated work** - If multiple test cases write similar code, bundle it as a script

### The Iteration Loop

1. Apply improvements to the skill
2. Rerun all test cases into a new iteration directory
3. Present new results to the user
4. Read feedback, improve again, repeat

Keep going until:
- The user says they're happy
- All feedback is positive or empty
- No meaningful progress is being made

---

## Writing Patterns

### Defining Output Formats

```markdown
## Report structure

ALWAYS use this exact template:

# [Title]

## Executive summary

## Key findings

## Recommendations
```

### Examples Pattern

```markdown
## Commit message format

**Example 1:**

Input: Added user authentication with JWT tokens
Output: feat(auth): implement JWT-based authentication
```

---

## Reference Files

Skills can include additional resources:

- **scripts/** - Executable code for deterministic/repetitive tasks
- **references/** - Documentation loaded into context as needed  
- **assets/** - Files used in output (templates, icons, fonts)

**Progressive Disclosure:**
1. Metadata (name + description) - Always in context (~100 words)
2. SKILL.md body - In context when skill triggers (<500 lines ideal)
3. Bundled resources - As needed (unlimited)

---

## Principle of Lack of Surprise

Skills must not contain:
- Malware or exploit code
- Content that could compromise system security
- Requests for unauthorized access or data exfiltration

Roleplay scenarios are acceptable, but skills should not facilitate malicious activities.

---

## Final Steps

Once the skill is complete:

1. **Package the skill** (if applicable to the platform)
2. **Present the .skill file** to the user with installation instructions
3. **Document usage** - Explain when and how to invoke the skill

---

## Core Loop Summary

1. Figure out what the skill is about
2. Draft or edit the skill
3. Run test prompts with the skill active
4. Evaluate outputs with the user
5. Repeat until satisfied
6. Package and return the final skill

Good luck!
