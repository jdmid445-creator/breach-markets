// Intro clips generated with Higgsfield (Seedance 2.0).
// They stream from Higgsfield's CDN for now. Once copied into /public/media,
// switch these to "/media/dive.mp4" and "/media/breach.mp4" (local files scrub
// more smoothly).
export const INTRO = {
  dive:
    process.env.NEXT_PUBLIC_INTRO_DIVE ??
    "https://d8j0ntlcm91z4.cloudfront.net/user_3MUqZwnnpETfFdEYnthNWyEXOMb/hf_20261123_072109_d775cf5e-639f-4bda-a307-f8add60be9c2.mp4",
  breach:
    process.env.NEXT_PUBLIC_INTRO_BREACH ??
    "https://d8j0ntlcm91z4.cloudfront.net/user_3MUqZwnnpETfFdEYnthNWyEXOMb/hf_20261123_072110_eede0598-cb1b-4bd7-9a99-56c915de70b7.mp4",
};
