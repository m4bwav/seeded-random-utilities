# Security policy

## Reporting a vulnerability

Report it privately through GitHub: open the repository's **Security** tab and choose **Report a vulnerability**. Please do not open a public issue for a security problem.

A confirmed problem is fixed in a new release, and the advisory is published once the fix is on npm.

## Supported versions

Only the latest major version (2.x) gets security fixes.

## What this package is not

seeded-random-utilities is not a cryptographic random number generator. Its sequences are meant to be reproducible: anyone who knows the seed, or has seen a few outputs, can work out the rest. That is by design and not a vulnerability. Use `crypto.getRandomValues()` for passwords, tokens, keys and anything with money on it.
