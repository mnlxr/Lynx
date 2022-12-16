# Lynx

<a href="https://hub.docker.com/r/jackbailey/lynx">
    <img alt="Image Size" src="https://img.shields.io/docker/image-size/jackbailey/lynx?label=Image%20Size">
</a>
<a href="https://hub.docker.com/r/jackbailey/lynx">
    <img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/jackbailey/lynx?label=Docker%20Pulls">
</a>
<a href="https://github.com/JackBailey/Lynx">
    <img alt="Image Size" src="https://img.shields.io/github/license/jackbailey/lynx?label=License">
</a>

## DISCLAIMER

This is still indev. A variety of security features are yet to be implemented. This is not production ready yet.

## About

A fullstack application to shorten your URLs.

I've tried a variety of URL shorteners but didn't find any with the functionality I wanted so I made my own.

My functionality I wanted:

-   Admin Interface
-   Option to redirect the root path
-   Simple UI

## Todo

-   [x] Account Settings
    -   [x] Email
    -   [x] Password
    -   [x] Username
-   [ ] Import
    -   [x] Shlink
    -   [x] Lynx
    -   [x] YOURLS
-   [x] Export
-   [ ] Full error handling
    -   [x] Invalid Inputs
    -   [ ] Check sanitization
    -   [x] Crashes

## Roadmap

-   [ ] ShareX support

    Maybe compatible with YOURLS?

-   [ ] Multi-user support

-   [ ] Image uploads?

-   [ ] QR codes

## Naming

Each item including a slug, destination and id is called a [`Link`](src/db/models/link.js), the plural being links.

Each link has a `slug`, this is the path in the source url. `example.com/2dch89772`'s slug would be `2dch89772`.

Each item including a username and password is called an [`Account`](src/db/models/account.js), the plural being accounts.
