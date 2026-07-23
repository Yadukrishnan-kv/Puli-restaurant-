import { useMenuContext } from "../context/MenuContext";

export const StorySection: React.FC = () => {
  const { story } = useMenuContext();

  return (
    <section className="story">
      <div className="container">
        <div className="story__inner">
          <p className="story__body">
            {story?.description ||
              "PULI is a name inspired by the initials of its visionary founders, and in Japanese, it beautifully means \"Born at Night.\" Just as the night gives birth to new possibilities, PULI represents a bold, fresh beginning in the culinary landscape of Jubail, KSA."}
          </p>
          <p className="story__body story__body--hide-on-mobile">
            {story?.title
              ? story.title
              : "The founders set out with a clear ambition: to introduce a dining experience unlike anything the newly developed Al Fanater district has experienced. Their passion led them to bring forward the vibrant, diverse, and ever‑evolving world of Pan Asian cuisine — spanning India, China, Thailand, Japan, Korea, Malaysia, Singapore, and more."}
          </p>
          <a
            href="https://www.sayosaudi.com/story.html"
            target="_blank"
            rel="noreferrer"
            className="story__link"
          >
            Read Our Full Story →
          </a>
        </div>
      </div>
    </section>
  );
};

