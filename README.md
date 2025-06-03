# Zoom Call Manager
> The easy solution for managing your what number to call from on zoom for all `tel:` links

## Getting Started
1. Download the latest release from [releases](https://github.com/EastArctica/zoom-call-manager). For Windows, download the `Zoom-Call-Manager-Setup-x.x.x.exe` file.
 - Note: While downloading, you may be prompted with `This program isn't commonly downloaded. Make sure you trust it before you open it.`. Please press the three dots followed my keep. Another menu may appear where you need to click `Show More` and `Keep Anyway`
2. Run the downloaded file. A popup should apear installing the program.
3. Once installed, the program will open automatically.

### Initial Setup
First we will clear the warnings at the top of the screen, by default you will have a warning for not being the active `tel:` handler and not having any caller ids setup.
1. Click `Go to Settings` on the warning
2. Scroll to the bottom and select `Set as Default Tel Handler`, you should be prompted with a few options, select `Zoom Call Manager`, select `Always`
3. Scroll back up and set up your `Caller IDs`, enter your phone numbers with the proceeding country code (ex. `+1 617 555 1234`), then select `Add Caller ID`. Continue this for all your phone numbers.
4. Head back to the `Home` from the left
5. On Home, set your default caller id, or leave it as the zoom default
6. Create your mapping rules, these rules determine how which calls get routed to which caller ids
- Enter the `Phone Number Pattern`, any phone numbers that start with this will be routed to the selected `Zoom Phone Number`
- Optionally: Give a description to the rule
- You should now see the rule appear in the `Mapping Rules` section below

### Call log
Zoom Call Manager offers a `Call Log` feature allowing you to see what phone calls got matched to what caller id's as well as what rule was used to match them. \
This gives an easy history to determine when calls were made and an easy diagnostic to determine if your matching rules are set up correctly.

## Issues
Please report any issues on the [GitHub issues page here](https://github.com/EastArctica/zoom-call-manager/issues)