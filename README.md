# Delta

Delta is an interactive environment to design, test, and visualize DFAs and NFAs that prioritizes a declarative, code-first approach to automata design.

## Tech Demo

[![YouTube demonstration of Delta](https://img.youtube.com/vi/zOM9aVSUVi0/maxresdefault.jpg)](https://www.youtube.com/watch?v=zOM9aVSUVi0)

## Key Features

**Declarative Fluent API**: Define complex DFAs and NFAs using a readable, chainable JavaScript API that maps directly to formal mathematical tuples.

**Integrated Test Suites**: Treat automata as software by running batteries of test inputs with instant feedback.

**Thompson’s Construction Sandbox**: A dedicated stack-based API for building NFAs from regular expressions using union, concatenation, and kleene star operations.

**Subset Construction**: Seamlessly convert NFAs to DFAs with options to preserve state naming, providing a clear view of the power set construction.

**Sharing**: Shareable URLs let you easily save progress and send automata to others.

## Future Work

I plan to expand to PDAs and Turing Machines with the same visualization tools and fluent API that I've developed for NFAs and DFAs, focusing on streamlining common patterns like tape rewinding and complex state transitions.

## Build & Run

The codebase is a straightforward Node.js project:

1. Clone the repository
2. Install dependencies with `npm install`
3. Run the development environment using `npm run dev`
