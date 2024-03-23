<script setup lang="ts">
import type { CourseModule } from "@/shared/types";
import { Link } from "@/shared/ui/link";
import { Text } from "@/shared/ui/text";
import { Alert } from "@/shared/ui/alert";
import { filesize } from "@/shared/utils";

const props = defineProps<{
  module: CourseModule;
  token: string;
}>();

const prepareURL = (fileurl: string, type: string) => {
  const url = new URL(fileurl);

  if (type === "file") {
    url.searchParams.set("token", props.token);
  }

  return url.toString();
};
</script>

<template>
  <div class="space-y-1">
    <div class="flex items-center gap-2">
      <img :src="module.modicon" class="h-auto w-6 flex-none" />
      <span>
        <template v-if="module.url">
          <Link
            :to="
              module.contents?.length === 1
                ? prepareURL(
                    module.contents[0].fileurl,
                    module.contents[0].type,
                  )
                : module.url
            "
            hover
          >
            {{ module.name }}
          </Link>
        </template>
        <template v-else>
          <Text :msg="module.name" />
        </template>
      </span>
    </div>
    <Text
      v-if="module.description?.length"
      :msg="module.description"
      class="prose prose-sm my-0.5 border-l-4 pl-2 text-foreground"
    />
    <template v-if="module.contents && module.contents.length">
      <span
        v-if="module.contents.length === 1"
        class="break-all text-sm text-muted-foreground"
      >
        <template v-if="module.contents[0].type === 'url'">
          {{ module.contents[0].fileurl }}
        </template>
        <template v-else-if="module.contents[0].type === 'file'">
          {{ module.contents[0].filename }},
          {{ filesize(module.contents[0].filesize) }}
        </template>
      </span>
      <span v-else>
        <Alert variant="destructive"> Unsupported behavior (Contact us) </Alert>
      </span>
    </template>
  </div>
</template>
