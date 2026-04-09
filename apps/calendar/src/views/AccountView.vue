<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import GroupSelect from "@/components/GroupSelect.vue";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { useGroupsQuery } from "@/lib/api";
import { useClearSession, useSessionQuery } from "@/lib/api/session";
import {
  useGenerateRemoodleToken,
  useSetPrimaryGroup,
  useUserProfileQuery,
} from "@/lib/api/user";
import { authClient } from "@/lib/auth-client";

const router = useRouter();
const { data: session } = useSessionQuery();
const { data: groups } = useGroupsQuery();
const { data: profile, refetch: refetchProfile } = useUserProfileQuery();

const setPrimaryGroup = useSetPrimaryGroup();
const generateToken = useGenerateRemoodleToken();
const clearSession = useClearSession();

const selectedGroup = ref("");
const generatedCode = ref<string | null>(null);
const copied = ref(false);

watch(
  [groups, profile],
  ([allGroups, userProfile]) => {
    if (selectedGroup.value) return;
    if (userProfile?.primaryGroup) {
      selectedGroup.value = userProfile.primaryGroup;
      return;
    }
    if (allGroups?.length) {
      selectedGroup.value = allGroups[0]!;
    }
  },
  { immediate: true },
);

const canSavePrimaryGroup = computed(
  () =>
    !!selectedGroup.value &&
    profile.value?.primaryGroup !== selectedGroup.value &&
    !!groups.value?.includes(selectedGroup.value),
);

async function savePrimaryGroup() {
  if (!canSavePrimaryGroup.value) return;
  await setPrimaryGroup.mutateAsync(selectedGroup.value);
  await refetchProfile();
}

async function generateCode() {
  const result = await generateToken.mutateAsync();
  generatedCode.value = result.token;
  copied.value = false;
}

async function copyCode() {
  if (!generatedCode.value) return;
  await navigator.clipboard.writeText(generatedCode.value);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
}

async function signOut() {
  await authClient.signOut();
  clearSession();
  await router.replace("/login");
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <header class="border-b">
      <div
        class="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3"
      >
        <div>
          <p class="text-sm font-semibold tracking-tight">Account</p>
          <p class="text-xs text-muted-foreground">
            {{ session?.data?.user.email }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <ThemeSwitcher />
          <Button variant="outline" size="sm" @click="router.push('/schedule')">
            Back to schedule
          </Button>
          <Button variant="ghost" size="sm" @click="signOut">Sign out</Button>
        </div>
      </div>
    </header>

    <main class="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6">
      <section class="rounded-2xl border bg-card p-5 shadow-sm">
        <div class="flex flex-col gap-2">
          <p class="text-lg font-semibold tracking-tight">Primary group</p>
          <p class="text-sm text-muted-foreground">
            This group is used by ReMoodle for your schedule features.
          </p>
        </div>

        <Separator class="my-5" />

        <div class="flex flex-col gap-4">
          <div class="max-w-sm">
            <GroupSelect v-model="selectedGroup" :all-groups="groups ?? []" />
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <Button
              :disabled="
                !canSavePrimaryGroup || setPrimaryGroup.isPending.value
              "
              @click="savePrimaryGroup"
            >
              <Icon icon="lucide:save" class="mr-2 h-4 w-4" />
              {{
                setPrimaryGroup.isPending.value
                  ? "Saving..."
                  : "Save primary group"
              }}
            </Button>

            <p class="text-sm text-muted-foreground">
              Current:
              <span class="font-medium text-foreground">
                {{ profile?.primaryGroup || "not set" }}
              </span>
            </p>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border bg-card p-5 shadow-sm">
        <div class="flex flex-col gap-2">
          <p class="text-lg font-semibold tracking-tight">
            Connect to ReMoodle
          </p>
          <p class="text-sm text-muted-foreground">
            Generate a short code, then send it to
            <span class="font-mono text-foreground">@remoodle_bot</span>.
          </p>
        </div>

        <Separator class="my-5" />

        <div class="flex flex-col gap-4">
          <template v-if="generatedCode">
            <div
              class="flex items-center justify-between rounded-xl border border-dashed bg-muted/40 px-4 py-3"
            >
              <span class="font-mono text-xl font-semibold tracking-[0.2em]">
                {{ generatedCode }}
              </span>

              <Button variant="ghost" size="icon" @click="copyCode">
                <Icon
                  :icon="copied ? 'lucide:check' : 'lucide:copy'"
                  class="h-4 w-4"
                />
              </Button>
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                :disabled="generateToken.isPending.value"
                @click="generateCode"
              >
                Regenerate code
              </Button>
              <p class="text-sm text-muted-foreground">Valid for 10 minutes.</p>
            </div>
          </template>

          <template v-else>
            <Button
              class="w-fit"
              :disabled="generateToken.isPending.value"
              @click="generateCode"
            >
              <Icon icon="lucide:link" class="mr-2 h-4 w-4" />
              {{
                generateToken.isPending.value
                  ? "Generating..."
                  : "Generate code"
              }}
            </Button>
          </template>
        </div>
      </section>
    </main>
  </div>
</template>
