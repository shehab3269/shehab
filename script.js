  // ----- Followers counter -----
  // FALLBACK_COUNT is shown immediately and used if no live source is configured.
  const FALLBACK_COUNT = 25100;

  // Point this at your deployed serverless function (see /api/followers.js).
  // Once deployed on Vercel it will be something like:
  //   "https://your-site.vercel.app/api/followers"
  // Leave as null to just use FALLBACK_COUNT.
  const FOLLOWERS_API_URL = "/api/followers";

  const STORAGE_KEY = "followers_cache_v1";
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  function formatCount(n){
    if(n >= 1000) return (n/1000).toFixed(1).replace(/\.0$/,'') + "K";
    return String(n);
  }

  function animateCount(el, target){
    const duration = 1600;
    const start = performance.now();
    function tick(now){
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatCount(Math.round(target * eased));
      if(p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  async function getFollowerCount(){
    let cached = null;
    try{ cached = JSON.parse(localStorage.getItem(STORAGE_KEY)); }catch(e){}

    const isStale = !cached || (Date.now() - cached.ts > WEEK_MS);

    if(!isStale) return cached.count;

    if(FOLLOWERS_API_URL){
      try{
        const res = await fetch(FOLLOWERS_API_URL, { cache: "no-store" });
        const data = await res.json();
        const count = Number(data.total) || FALLBACK_COUNT;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ count, ts: Date.now() }));
        return count;
      }catch(e){
        // API failed — fall back silently
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: FALLBACK_COUNT, ts: Date.now() }));
    return FALLBACK_COUNT;
  }

  getFollowerCount().then(count => {
    const el = document.getElementById("followersCount");
    if(!el) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          animateCount(el, count);
          observer.disconnect();
        }
      });
    }, { threshold: 0.5 });

    observer.observe(el);
  });
