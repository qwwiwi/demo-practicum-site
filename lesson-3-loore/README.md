# Lesson 3 · Social media analytics with Loore

Open /lesson-3-loore/ through a static web server. The lesson covers Oscar Hartmann's public YouTube, Instagram and Telegram accounts. Select a platform and click a chart point or a publication to open the original and any available media or transcript.

The seven-day window includes the collection date in Moscow. The horizontal axis is publication time. The vertical axis shows cumulative public views measured at collection time. Older posts have had longer to accumulate views. Subscriber counts are also snapshots.

## Refresh the publication index

Supply LOORE_API_KEY in the local process environment. Run the following from this directory:

    python3 scripts/refresh-oscar.py oscar.json
    python3 scripts/update-history.py oscar.json history.json

The refresh uses Loore credits. Review coverage and the date window, then publish the updated snapshot through the project pull request workflow. Media and details are a separate snapshot keyed by original publication URL. A new post can appear before its transcript and files have been prepared.

## Sources

- [Oscar Hartmann](https://oskarhartmann.com/ru)
- [Loore tool catalog](https://loore.ai/docs/tools/)
- [Chart.js](https://github.com/chartjs/Chart.js) — MIT; bundled locally under vendor/.

Public Instagram carousel views are excluded from view comparisons. Views in the Instagram section cover Reels only. Missing engagement counters stay null.
