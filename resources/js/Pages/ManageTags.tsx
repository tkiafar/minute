import { useForm } from '@inertiajs/react';
import React, { useMemo, useRef } from 'react';

import ConfirmAction from '@/Components/ConfirmAction';
import DialogModal from '@/Components/DialogModal';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Button } from '@/Components/ui/button';
import useRoute from '@/Hooks/useRoute';
import AppLayout from '@/Layouts/AppLayout';
import classNames from 'classnames';
import { SquarePen, SquarePlus, Trash2 } from 'lucide-react';
import { Slide, ToastContainer, toast } from 'react-toastify';

type TTreeNode = {
  id: number;
  name: string;
  parent_id: number | null;
  children?: TTreeNode[];
  level?: number;
};

type TTag = {
  id: number;
  name: string;
  parent_id: number;
};

type Props = {
  tags: TTag[];
};

export default function ManageTags({ tags }: Props) {
  const [showEditModal, setShowEditModal] = React.useState(false);
  const route = useRoute();
  const confirmActionRef = useRef<any>(null);
  const form = useForm({
    id: '',
    name: '',
    parent_id: '',
  });

  const modalTitle = useMemo(() => {
    if (form.data.id) {
      return `Change ${form.data.name} Name`;
    } else {
      const parent = tags.find(tag => tag.id === Number(form.data.parent_id));
      return `Add New Tag ${parent ? `to ${parent.name}` : ''}`;
    }
  }, [form.data.id]);

  function transformTagRecords(
    records: TTreeNode[],
    parentId: number | null = null,
    level: number = 0,
  ): TTreeNode[] {
    const result: TTreeNode[] = [];

    records.forEach(record => {
      if (record.parent_id === parentId) {
        const children = transformTagRecords(records, record.id, level + 1);
        if (children.length) {
          record.children = children;
        }
        record.level = level;
        result.push(record);
      }
    });

    return result;
  }

  const nodes = transformTagRecords(tags);

  function resetForm() {
    form.reset('id', 'name', 'parent_id');
  }

  function dismissEditModal() {
    setShowEditModal(false);
  }

  function createTag() {
    form.post(route('tags.store'), {
      onSuccess: response => {
        resetForm();
        dismissEditModal();
        const { name } = response.props.responseData as TTag;
        toast.success(`"${name}" tag created`, {
          containerId: 'manage-tags-toast-notif',
        });
      },
    });
  }

  function updateTag() {
    const url = route('tags.update', { tag: form.data.id });
    form.put(url, {
      onSuccess: response => {
        resetForm();
        dismissEditModal();
        const { name } = response.props.responseData as TTag;
        toast.success(`"${name}" tag updated`, {
          containerId: 'manage-tags-toast-notif',
        });
      },
    });
  }

  function submitTag(e: React.FormEvent) {
    e.preventDefault();
    if (form.data.id) {
      updateTag();
    } else {
      createTag();
    }
  }

  function childNodeRemoved(node: TTreeNode) {
    toast.info(`"${node.name}" removed`, {
      containerId: 'manage-tags-toast-notif',
    });
  }

  function removeChildNode(node: TTreeNode) {
    const url = route('tags.destroy', node.id);
    form.delete(url, {
      onSuccess: () => {
        childNodeRemoved(node);
      },
    });
  }

  function openEditTagModal(node: TTreeNode) {
    form.setData({ id: node.id.toString(), name: node.name, parent_id: '' });
    setShowEditModal(true);
  }

  function openAddNewTagModal(node: TTreeNode) {
    const parentId = node.id === 0 ? '' : node.id.toString();
    form.setData({ id: '', name: '', parent_id: parentId });
    setShowEditModal(true);
  }

  function openRemoveConfirmationModal(node: TTreeNode) {
    confirmActionRef.current.show({
      confirmCallback: () => removeChildNode(node),
      title: `Remove the ${node.name} tag?`,
      message: (
        <span>
          <strong>{node.name}</strong> will be deleted permanently.
        </span>
      ),
    });
  }

  function renderTree(nodes: TTreeNode[]): JSX.Element[] {
    return nodes.map(node => (
      <div key={node.id} className={`ml-${node.level && 4}`}>
        <div className="tag-item-row relative flex items-center gap-1 border-l-2 border-slate-300 pl-1 hover:bg-indigo-100 dark:border-slate-700 hover:dark:bg-indigo-900">
          <div className="asd">#</div>
          <div>{node.name}</div>
          <div className="action-buttons ml-auto flex">
            <div
              title="Add a Child Tag"
              onClick={() => openAddNewTagModal(node)}
              className="p-1 hover:cursor-pointer hover:bg-gray-300 hover:dark:bg-gray-700"
            >
              <SquarePlus size={16} />
            </div>

            <div
              title="Edit Tag Name"
              onClick={() => openEditTagModal(node)}
              className="p-1 hover:cursor-pointer hover:bg-gray-300 hover:dark:bg-gray-700"
            >
              <SquarePen size={16} />
            </div>

            {(!node.children || node.children.length === 0) && (
              <div
                title="Remove Tag"
                className="p-1 hover:cursor-pointer hover:bg-gray-300 hover:dark:bg-gray-700"
                onClick={() => openRemoveConfirmationModal(node)}
              >
                <Trash2 size={16} />
              </div>
            )}
          </div>

          {node.children && node.children.length > 0 && (
            <span className="return-sign absolute font-bold text-slate-300 dark:text-slate-700">
              &#8627;
            </span>
          )}
        </div>
        {node.children && node.children.length > 0 && renderTree(node.children)}
      </div>
    ));
  }

  return (
    <AppLayout title="Manage Tags">
      <ConfirmAction ref={confirmActionRef} />

      <div className="bg-dots-darker dark:bg-dots-lighter :selectiontext-white relative min-h-screen bg-gray-100 bg-center selection:bg-red-500 dark:bg-gray-900 sm:flex sm:items-center sm:justify-center">
        <div className="mx-auto max-w-7xl p-6 lg:p-8">
          <div className="flex justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="#FF2D20"
              className="h-16 w-auto"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 6h.008v.008H6V6Z"
              />
            </svg>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-6 lg:gap-8">
              <div className="scale-100 rounded-lg bg-white from-gray-700/50 via-transparent p-6 shadow-2xl shadow-gray-500/20 dark:bg-gray-800/50 dark:bg-gradient-to-bl dark:shadow-none dark:ring-1 dark:ring-inset dark:ring-white/5">
                <h2 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">
                  Edit Your Tags
                </h2>

                <div className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {renderTree(nodes)}
                </div>

                <div
                  className="mt-2 flex cursor-pointer justify-end rounded py-1 pr-1 text-right hover:bg-gray-300 hover:dark:bg-gray-700"
                  onClick={() =>
                    openAddNewTagModal({
                      id: 0,
                      name: 'rootTag',
                      parent_id: null,
                    })
                  }
                >
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ADD ROOT NODE
                  </span>
                  <div
                    title="Add a Top Level Tag"
                    className="ml-1 text-gray-500 hover:cursor-pointer dark:text-gray-400"
                  >
                    <SquarePlus size={16} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <ul className="list-inside list-disc">
              <li>Removing tags doesn't remove the notes</li>
            </ul>
          </div>
        </div>
      </div>

      <ToastContainer
        autoClose={3000}
        containerId="manage-tags-toast-notif"
        draggable
        hideProgressBar
        position="bottom-left"
        theme="dark"
        transition={Slide}
      />

      <DialogModal
        isOpen={showEditModal}
        onClose={dismissEditModal}
        maxWidth="sm"
      >
        <DialogModal.Content title={modalTitle}>
          <div className="mt-4">
            <form onSubmit={submitTag} id="tag-form">
              <div>
                <InputLabel htmlFor="name">Tag Name</InputLabel>
                <TextInput
                  id="name"
                  type="text"
                  className="mt-1 block w-full"
                  name="name"
                  value={form.data.name}
                  onChange={e => form.setData('name', e.target.value)}
                  required
                  autoFocus
                  autoComplete="name"
                />
                <InputError className="mt-2" message={form.errors.name} />
              </div>

              <input
                type="hidden"
                name="parent_id"
                value={form.data.parent_id}
              />
            </form>
          </div>
        </DialogModal.Content>

        <DialogModal.Footer>
          <Button variant="secondary" onClick={dismissEditModal}>
            Cancel
          </Button>

          <Button
            className={classNames('ml-2', { 'opacity-25': form.processing })}
            form="tag-form"
            disabled={form.processing}
          >
            Submit
          </Button>
        </DialogModal.Footer>
      </DialogModal>
    </AppLayout>
  );
}
