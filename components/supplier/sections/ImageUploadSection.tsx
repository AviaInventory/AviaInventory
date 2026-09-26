"use client";

import Image from "next/image";
import type { Dispatch, SetStateAction } from "react";
import type { PartFormData } from "../types";

interface Props {
  formData: PartFormData;
  setFormData: Dispatch<SetStateAction<PartFormData>>;
}

export default function ImageUploadSection({
  formData,
  setFormData,
}: Props) {
  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;

    if (!files) return;

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...Array.from(files)],
    }));
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm">

      <div className="mb-6">

        <h2 className="text-2xl font-bold text-aviation-primary">
          Images
        </h2>

        <p className="mt-2 text-aviation-muted">
          Upload clear images of the aircraft part. The first image will be used
          as the main marketplace image.
        </p>

      </div>

      <label
        htmlFor="images"
        className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-aviation-border p-10 text-center transition hover:border-aviation-border"
      >
        <p className="text-lg font-semibold">
          Click to upload images
        </p>

        <p className="mt-2 text-sm text-aviation-muted">
          PNG, JPG or JPEG • Multiple files supported
        </p>

        <input
          id="images"
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </label>

      {formData.images.length > 0 && (

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

          {formData.images.map((image, index) => (

            <div
              key={index}
              className="relative overflow-hidden rounded-2xl border"
            >

              <div className="relative h-52 w-full">

                <Image
                  src={URL.createObjectURL(image)}
                  alt={`Part ${index + 1}`}
                  fill
                  className="object-cover"
                />

              </div>

              <div className="flex items-center justify-between p-4">

                <p className="truncate text-sm">
                  {image.name}
                </p>

                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="rounded-lg bg-aviation-error px-3 py-1 text-sm text-white hover:bg-aviation-error"
                >
                  Remove
                </button>

              </div>

            </div>

          ))}

        </div>

      )}

    </section>
  );
}