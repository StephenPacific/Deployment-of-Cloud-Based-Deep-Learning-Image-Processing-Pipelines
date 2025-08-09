
import torch
from torch.autograd import Variable

import random
import os

import numpy as np
#%%
class ReplayBuffer():
    def __init__(self, max_size=50):
        assert (max_size > 0), 'Empty buffer or trying to create a black hole. Be careful.'
        self.max_size = max_size
        self.data = []

    def push_and_pop(self, data):
        to_return = []
        for element in data.data:
            element = torch.unsqueeze(element, 0)

            if len(self.data) < self.max_size:
                self.data.append(element)
                to_return.append(element)
            else:
                if random.uniform(0,1) > 0.5:
                    i = random.randint(0, self.max_size-1)
                    to_return.append(self.data[i].clone())
                    self.data[i] = element
                else:
                    to_return.append(element)
        return Variable(torch.cat(to_return))

class LambdaLR():
    def __init__(self, n_epochs, offset, decay_start_epoch):
        assert ((n_epochs - decay_start_epoch) > 0), "Decay must start before the training session ends!"
        self.n_epochs = n_epochs
        self.offset = offset
        self.decay_start_epoch = decay_start_epoch

    def step(self, epoch):
        return 1.0 - max(0, epoch + self.offset - self.decay_start_epoch)/(self.n_epochs - self.decay_start_epoch)

def weights_init_normal(m):
    classname = m.__class__.__name__
    if classname.find('Conv') != -1:
        torch.nn.init.normal_(m.weight.data, 0.0, 0.02)
    elif classname.find('BatchNorm2d') != -1:
        torch.nn.init.normal_(m.weight.data, 1.0, 0.02)
        torch.nn.init.constant_(m.bias.data, 0.0)

def prepare_device(use_cuda: bool, gpu_index: int) -> torch.device:
    """
    Select and return the appropriate torch.device based on CUDA availability and user preference.

    Args:
        use_cuda (bool): Whether to use CUDA.
        gpu_index (int): The GPU index to use if CUDA is enabled.

    Returns:
        torch.device: The device to be used (CPU or specific GPU).
    """
    if torch.cuda.is_available():
        if not use_cuda:
            print("WARNING: CUDA device detected, but CUDA usage is disabled. Run with --cuda to enable.")
            print("Available GPUs:")
            for idx in range(torch.cuda.device_count()):
                print(f"  GPU {idx}: {torch.cuda.get_device_name(idx)}")
            return torch.device("cpu")
        else:
            num_gpus = torch.cuda.device_count()
            if gpu_index >= num_gpus:
                raise ValueError(f"Invalid GPU index: {gpu_index}. Available GPUs: 0 to {num_gpus - 1}.")
            return torch.device(f"cuda:{gpu_index}")
    else:
        if use_cuda:
            print("WARNING: CUDA requested but no CUDA device is available. Falling back to CPU.")
        return torch.device("cpu")

def prepare_seed(seed):
    """Set all random seeds for reproducibility."""

    os.environ['PYTHONHASHSEED'] = str(seed)
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)

    # # Ensure deterministic behavior in cuDNN (important for reproducibility)
    # torch.backends.cudnn.deterministic = True
    # torch.backends.cudnn.benchmark = False
    return seed    