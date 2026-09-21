import { Globe } from "lucide-react";
import { GithubIcon, TwitterIcon, LinkedinIcon } from "@/components/ui/icons";

export interface AuthorCardProps {
  author: {
    _id?: string;
    name: string;
    avatar?: string;
    bio?: string;
    socialLinks?: {
      twitter?: string;
      github?: string;
      linkedin?: string;
      website?: string;
    };
  };
}

export function AuthorCard({ author }: AuthorCardProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-6 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xs my-8">
      {author.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={author.avatar}
          alt={author.name}
          className="h-16 w-16 rounded-2xl object-cover border-2 border-primary/20 shadow-md shrink-0"
        />
      ) : (
        <div className="h-16 w-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-bold text-2xl shrink-0">
          {author.name.charAt(0)}
        </div>
      )}

      <div className="space-y-2 flex-1">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary block">
              Written by
            </span>
            <h4 className="text-lg font-bold text-foreground">{author.name}</h4>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {author.bio ||
            "Contributor and engineering writer sharing insights on modern web development and software architecture."}
        </p>

        {author.socialLinks && (
          <div className="flex items-center gap-3 pt-1">
            {author.socialLinks.twitter && (
              <a
                href={author.socialLinks.twitter}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                title="Twitter"
              >
                <TwitterIcon className="h-3.5 w-3.5" />
              </a>
            )}
            {author.socialLinks.github && (
              <a
                href={author.socialLinks.github}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                title="GitHub"
              >
                <GithubIcon className="h-4 w-4" />
              </a>
            )}
            {author.socialLinks.linkedin && (
              <a
                href={author.socialLinks.linkedin}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                title="LinkedIn"
              >
                <LinkedinIcon className="h-4 w-4" />
              </a>
            )}
            {author.socialLinks.website && (
              <a
                href={author.socialLinks.website}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                title="Website"
              >
                <Globe className="h-4 w-4" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
