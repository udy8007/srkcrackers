"use client";

import { useEffect, useState } from "react";
import { BUSINESS } from "@/lib/constants";
import "@/app/crackro-hero.css";

const SHINCHAN_FRAMES = [
  "/images/shinchan-cut-1.png",
  "/images/shinchan-cut-2.png",
  "/images/shinchan-cut-3.png",
  "/images/shinchan-cut-4.png",
];

export function Hero() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    SHINCHAN_FRAMES.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
    const id = window.setInterval(() => {
      setFrame((n) => (n + 1) % SHINCHAN_FRAMES.length);
    }, 1200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="hero" id="home">
      <div className="hero-top-sky" aria-hidden="true">
        <div className="hero-top-glow" />
        <div className="hero-sky-burst hero-sky-burst--center" />
        <div className="hero-sky-burst hero-sky-burst--left" />
        <div className="hero-sky-burst hero-sky-burst--right" />
        <div className="hero-sky-burst hero-sky-burst--mid" />
        <div className="hero-garland">
          <span className="hero-garland__wire" />
          <span className="hero-lamp hero-lamp--1">
            <i className="fa-solid fa-lightbulb" />
          </span>
          <span className="hero-lamp hero-lamp--2">
            <i className="fa-solid fa-lightbulb" />
          </span>
          <span className="hero-lamp hero-lamp--3">
            <i className="fa-solid fa-lightbulb" />
          </span>
          <span className="hero-lamp hero-lamp--4">
            <i className="fa-solid fa-lightbulb" />
          </span>
          <span className="hero-lamp hero-lamp--5">
            <i className="fa-solid fa-lightbulb" />
          </span>
          <span className="hero-lamp hero-lamp--6">
            <i className="fa-solid fa-lightbulb" />
          </span>
          <span className="hero-lamp hero-lamp--7">
            <i className="fa-solid fa-lightbulb" />
          </span>
        </div>
        <div className="hero-top-sparks">
          <span /><span /><span /><span /><span /><span />
          <span /><span /><span /><span /><span /><span />
        </div>

        <div className="hero-celeb">
          <div className="celeb-sky">
            <span className="celeb-rocket celeb-rocket--1"><i /><b /></span>
            <span className="celeb-rocket celeb-rocket--2"><i /><b /></span>
            <span className="celeb-rocket celeb-rocket--3"><i /><b /></span>
            <span className="celeb-bloom celeb-bloom--1" />
            <span className="celeb-bloom celeb-bloom--2" />
            <span className="celeb-bloom celeb-bloom--3" />
            <span className="celeb-ember" /><span className="celeb-ember" />
            <span className="celeb-ember" /><span className="celeb-ember" />
            <span className="celeb-ember" /><span className="celeb-ember" />
            <span className="celeb-ember" /><span className="celeb-ember" />
          </div>

        </div>
      </div>

      <div className="hero-side-skyshots" aria-hidden="true">
        <span className="side-shot side-shot--left-a">
          <i className="side-shot__rocket" /><b className="side-shot__trail" /><em className="side-shot__bloom" />
        </span>
        <span className="side-shot side-shot--left-b">
          <i className="side-shot__rocket" /><b className="side-shot__trail" /><em className="side-shot__bloom side-shot__bloom--pink" />
        </span>
        <span className="side-shot side-shot--left-c">
          <i className="side-shot__rocket" /><b className="side-shot__trail" /><em className="side-shot__bloom side-shot__bloom--orange" />
        </span>
        <span className="side-shot side-shot--right-a">
          <i className="side-shot__rocket" /><b className="side-shot__trail" /><em className="side-shot__bloom side-shot__bloom--orange" />
        </span>
        <span className="side-shot side-shot--right-b">
          <i className="side-shot__rocket" /><b className="side-shot__trail" /><em className="side-shot__bloom side-shot__bloom--violet" />
        </span>
        <span className="side-shot side-shot--right-c">
          <i className="side-shot__rocket" /><b className="side-shot__trail" /><em className="side-shot__bloom" />
        </span>
        <span className="side-shot side-shot--mid-l">
          <i className="side-shot__rocket" /><b className="side-shot__trail" /><em className="side-shot__bloom side-shot__bloom--pink" />
        </span>
        <span className="side-shot side-shot--mid-c">
          <i className="side-shot__rocket" /><b className="side-shot__trail" /><em className="side-shot__bloom" />
        </span>
        <span className="side-shot side-shot--mid-r">
          <i className="side-shot__rocket" /><b className="side-shot__trail" /><em className="side-shot__bloom side-shot__bloom--violet" />
        </span>
        <span className="side-shot side-shot--top-l">
          <i className="side-shot__rocket" /><b className="side-shot__trail" /><em className="side-shot__bloom side-shot__bloom--orange" />
        </span>
        <span className="side-shot side-shot--low-l">
          <i className="side-shot__rocket" /><b className="side-shot__trail" /><em className="side-shot__bloom" />
        </span>
        <span className="side-shot side-shot--low-r">
          <i className="side-shot__rocket" /><b className="side-shot__trail" /><em className="side-shot__bloom side-shot__bloom--pink" />
        </span>
      </div>

      <div className="hero-sparkles" aria-hidden="true">
        <span /><span /><span /><span /><span /><span />
        <span /><span /><span /><span />
      </div>
      <div className="hero-lanterns hero-lanterns--legacy" aria-hidden="true">
        <i className="fa-solid fa-lightbulb" />
        <i className="fa-solid fa-lightbulb" />
        <i className="fa-solid fa-lightbulb" />
      </div>

      <div className="hero-mobile-festive" aria-hidden="true">
        <span className="m-sky m-sky--1"><i /><b /></span>
        <span className="m-sky m-sky--2"><i /><b /></span>
        <span className="m-sky m-sky--3"><i /><b /></span>
        <span className="m-sky m-sky--4"><i /><b /></span>
        <span className="m-bloom m-bloom--1" />
        <span className="m-bloom m-bloom--2" />
        <span className="m-bloom m-bloom--3" />
        <span className="m-bloom m-bloom--4" />
        <span className="m-spark" /><span className="m-spark" /><span className="m-spark" /><span className="m-spark" />
        <span className="m-spark" /><span className="m-spark" /><span className="m-spark" /><span className="m-spark" />
        <span className="m-mortar m-mortar--left" />
        <span className="m-mortar m-mortar--right" />
      </div>

      <div className="hero-deco" aria-hidden="true">
        <div className="hero-burst hero-burst--1" />
        <div className="hero-burst hero-burst--2" />
        <div className="hero-burst hero-burst--3" />

        <figure className="hero-float hero-float--rocket">
          <div className="c-cracker c-cracker--rocket c-cracker--lg">
            <span className="c-cracker__spark" />
            <span className="c-cracker__fuse" />
            <span className="c-cracker__nose" />
            <span className="c-cracker__body" />
            <span className="c-cracker__fins" />
          </div>
          <span className="hero-deco-shadow" />
        </figure>

        <figure className="hero-float hero-float--skyshot-launch">
          <div className="skyshot-launch">
            <span className="skyshot-launch__trail" />
            <span className="skyshot-launch__burst" />
            <div className="c-cracker c-cracker--rocket c-cracker--md">
              <span className="c-cracker__spark" />
              <span className="c-cracker__fuse" />
              <span className="c-cracker__nose" />
              <span className="c-cracker__body" />
              <span className="c-cracker__fins" />
            </div>
          </div>
          <span className="hero-deco-shadow" />
        </figure>

        <figure className="hero-float hero-float--chakri">
          <div className="c-cracker c-cracker--chakri">
            <span className="c-cracker__wheel" />
            <span className="c-cracker__hub" />
          </div>
          <span className="hero-deco-shadow" />
        </figure>

        <figure className="hero-float hero-float--gift">
          <div className="c-cracker c-cracker--gift">
            <span className="c-cracker__bow" />
            <span className="c-cracker__gift-box" />
          </div>
          <span className="hero-deco-shadow" />
        </figure>

        <div className="hero-spark-trails">
          <span className="hero-trail hero-trail--1" />
          <span className="hero-trail hero-trail--2" />
          <span className="hero-trail hero-trail--3" />
        </div>
      </div>

      <div className="container hero-inner">
        <div className="hero-content">
          <p className="eyebrow">
            <i className="fa-solid fa-star" /> Diwali Special — Flat 80% OFF
          </p>
          <h1>
            Light up every celebration with{" "}
            <span className="text-gradient">{BUSINESS.name}</span>
          </h1>
          <p className="hero-text">
            Safe, certified fireworks for Diwali, weddings, and celebrations — factory prices and
            delivery across Tamil Nadu from {BUSINESS.name}, Morai, Avadi.
          </p>
          <div className="hero-cta">
            <a href="#products" className="btn btn-primary btn-lg">
              <i className="fa-solid fa-bag-shopping" /> Shop Crackers
            </a>
            <a href="#gift-packs" className="btn btn-outline btn-lg">
              <i className="fa-solid fa-gift" /> Gift Boxes
            </a>
          </div>
        </div>
        <div className="hero-cast-slot">
          <div className="celeb-stage celeb-stage--inline">
            <div className="celeb-cast celeb-cast--flip" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="celeb-cast__frame"
                src={SHINCHAN_FRAMES[frame]}
                alt=""
                width={420}
                height={480}
                decoding="async"
                draggable={false}
              />
            </div>
            <div className="celeb-spark-spray celeb-spark-spray--dad">
              <i /><i /><i /><i /><i /><i /><i /><i />
            </div>
            <div className="celeb-spark-spray celeb-spark-spray--mom">
              <i /><i /><i /><i /><i /><i /><i /><i />
            </div>
            <div className="celeb-spark-spray celeb-spark-spray--girl">
              <i /><i /><i /><i /><i /><i /><i /><i />
            </div>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-visual-orbit">
            <figure className="hero-orbit-item hero-orbit-item--skyshot">
              <div className="skyshot-launch skyshot-launch--orbit">
                <span className="skyshot-launch__trail" />
                <span className="skyshot-launch__burst" />
                <div className="c-cracker c-cracker--rocket c-cracker--sm">
                  <span className="c-cracker__spark" />
                  <span className="c-cracker__fuse" />
                  <span className="c-cracker__nose" />
                  <span className="c-cracker__body" />
                  <span className="c-cracker__fins" />
                </div>
              </div>
              <span className="hero-deco-shadow hero-deco-shadow--sm" />
            </figure>
            <figure className="hero-orbit-item hero-orbit-item--chakri">
              <div className="c-cracker c-cracker--chakri c-cracker--sm">
                <span className="c-cracker__wheel" />
                <span className="c-cracker__hub" />
              </div>
              <span className="hero-deco-shadow hero-deco-shadow--sm" />
            </figure>
          </div>
          <div className="hero-panel">
            <div className="hero-badge">
              <i className="fa-solid fa-crown" /> Curated Celebration Collection
            </div>
            <div className="hero-showcase">
              <div className="hero-product-grid">
                <div className="hero-mini hero-mini--sparkler">
                  <span className="hero-mini__sparks">
                    <i className="fa-solid fa-wand-magic-sparkles" />
                  </span>
                  <span className="hero-mini__label">Golden Sparklers</span>
                </div>
                <div className="hero-mini hero-mini--gift hero-mini--featured">
                  <span className="hero-mini__ribbon" />
                  <span className="hero-mini__icon">
                    <i className="fa-solid fa-gift" />
                  </span>
                  <span className="hero-mini__label">Signature Gift Box</span>
                </div>
                <div className="hero-mini hero-mini--rocket">
                  <span className="hero-mini__icon">
                    <i className="fa-solid fa-fire-flame-curved" />
                  </span>
                  <span className="hero-mini__label">Festive Favourites</span>
                </div>
              </div>
              <h2>Celebrate in Style</h2>
              <p>Diwali · Weddings · New Year · Every Special Moment</p>
              <div className="hero-festive-tags">
                <span className="hero-festive-tags__hot">
                  <i className="fa-solid fa-star" /> Best Sellers
                </span>
                <span>Premium Quality</span>
                <span>Gift Collections</span>
              </div>
            </div>
            <ul className="hero-points">
              <li>
                <i className="fa-solid fa-check" /> Genuine quality products
              </li>
              <li>
                <i className="fa-solid fa-check" /> Competitive wholesale rates
              </li>
              <li>
                <i className="fa-solid fa-check" /> Secure packaging &amp; shipping
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
