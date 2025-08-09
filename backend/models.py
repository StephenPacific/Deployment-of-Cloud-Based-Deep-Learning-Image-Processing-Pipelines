import torch
import torch.nn as nn
import torch.nn.functional as F

import functools
import math
from typing import Tuple
#%%
class ResBlock(nn.Module):
    def __init__(self, inChannals, outChannals):
        super(ResBlock,self).__init__()
        
        self.conv1 = nn.Conv2d(inChannals, outChannals, kernel_size=1, bias=False)
        self.bn1 = nn.BatchNorm2d(outChannals)
        
        self.conv2 = nn.Conv2d(outChannals, outChannals, kernel_size=3, stride=1, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(outChannals)
        
        self.conv3 = nn.Conv2d(outChannals, outChannals, kernel_size=1, bias=False)
        self.relu = nn.PReLU()
        
    def forward(self,x):
        residual = x 
        
        out = self.conv1(x)
        out = self.bn1(out)
        out = self.relu(out)
        
        out = self.conv2(out)
        out = self.bn2(out)
        out = self.relu(out)
        
        out = self.conv3(out)
        
        out += residual
        
        out = self.relu(out)
        return out

class GeneratorSR(nn.Module):   
    def __init__(
        self,
        inShape: Tuple[int, int, int],
        outShape: Tuple[int, int, int],
        baseFilters: int = 64,
        numResBlocks: int = 6,
    ):
        super(GeneratorSR, self).__init__()
        inChannels, inSize1, inSize2 = inShape
        outChannels, outSize1, outSize2 = outShape
       
        
        if outSize1 > inSize1:
            sf = outSize1 / inSize1
            if not float(sf).is_integer():
                raise ValueError(f"Scale factor (sf={sf}) must be an integer.")
                
            numUps = int(math.floor(math.log2(sf)))
            scale_after_ups = 2 ** numUps
            final_scale = sf / scale_after_ups
            
            scale_factor = 2 
            final_scale = final_scale
           
        elif outSize1 < inSize1:
            sf = inSize1 / outSize1
            if not float(sf).is_integer():
                raise ValueError(f"Scale factor (sf={sf}) must be an integer.")
                
            numUps = int(math.floor(math.log2(sf)))
            scale_after_ups = 2 ** numUps
            final_scale = sf / scale_after_ups
            
            scale_factor = 0.5
            final_scale = 1 / final_scale

        else:
            raise ValueError("Input and output sizes are equal; no scaling needed.")

            
        # Initial convolution
        self.conv1 = nn.Conv2d(inChannels, baseFilters, kernel_size=9, stride=1, padding=4, padding_mode='reflect')
        self.relu = nn.PReLU()

        # Residual blocks
        self.resBlock = self._makeLayer_(ResBlock, baseFilters, baseFilters, numResBlocks)

        # Conv + Norm
        self.conv2 = nn.Conv2d(baseFilters, baseFilters, kernel_size=1)
        self.bn2 = nn.BatchNorm2d(baseFilters)

        # Upsampling blocks
        ups = []
        in_ch = baseFilters
        for _ in range(numUps):
            out_ch = in_ch // 2
            if out_ch < 1: # this to check if the numUps is too big that the out_ch become < 1 (i.e. 1/2)
                raise ValueError("Either increase the number of baseFilters or reduce the sf.")
                
            ups.append(nn.Upsample(scale_factor=scale_factor, mode='nearest'))
            ups.append(nn.Conv2d(in_ch, out_ch, kernel_size=3, padding=1))
            ups.append(nn.PReLU())
            
            in_ch = out_ch
        if not math.isclose(final_scale, 1.0, rel_tol=1e-3): # this condition is only applied to upsampling 
            ups.append(nn.Upsample(scale_factor=final_scale, mode='nearest'))
        ups.append(nn.Conv2d(in_ch, in_ch, kernel_size=3, padding=1))
        ups.append(nn.PReLU())
               
        self.ups = nn.Sequential(*ups)

        # Final conv
        self.finConv = nn.Conv2d(in_ch, outChannels, kernel_size=3, stride=1, padding=1)

    
    def _makeLayer_(self, block, inChannals, outChannals, blocks):
        layers = []
        layers.append(block(inChannals,outChannals))
        
        for i in range(1,blocks):
            layers.append(block(outChannals, outChannals))      
        return nn.Sequential(*layers)
    
    def forward(self, x):
        
        x = self.conv1(x)
        x = self.relu(x)
        
        residual = x
        
        out = self.resBlock(x)
        
        out = self.conv2(out)
        out = self.bn2(out)        
        
        out = out + residual

        out = self.ups(out)
        
        out = self.finConv(out)
        return out    
    
# Defines the discriminator with the specified arguments.
class Discriminator(nn.Module):
    def __init__(self, 
                 inShape: Tuple[int, int, int], 
                 baseFilters: int = 64, 
                 numInterBlocks: int = 2):
        
        super(Discriminator, self).__init__()
        
        
        inChannels, inSize, _ = inShape
        
        model = [nn.Conv2d(inChannels, baseFilters, 4, stride=2, padding=1),
                 nn.LeakyReLU(0.2, inplace=True)]
        
        in_ch = baseFilters
        for i in range (numInterBlocks):
            out_ch = in_ch * 2
            
            model.append(nn.Conv2d(in_ch, out_ch, 4, stride=2, padding=1))
            model.append(nn.InstanceNorm2d(out_ch))
            model.append(nn.LeakyReLU(0.2, inplace=True))

            in_ch = out_ch
            
        model.append(nn.Conv2d(out_ch, 1, 4, padding=1))
        self.model = nn.Sequential(*model)

    def forward(self, x):
        x = self.model(x)
        x = F.avg_pool2d(x, x.size()[2:])
        x = torch.flatten(x)
        return x
    
class ResnetGenerator(nn.Module):
    """Resnet-based generator that consists of Resnet blocks between a few downsampling/upsampling operations.
    We adapt Torch code and idea from Justin Johnson's neural style transfer project(https://github.com/jcjohnson/fast-neural-style)
    """

    def __init__(self, input_nc, output_nc, ngf=64, norm_layer=nn.BatchNorm2d, use_dropout=False, n_blocks=5, padding_type='reflect'):
        """Construct a Resnet-based generator
        Parameters:
            input_nc (int)      -- the number of channels in input images
            output_nc (int)     -- the number of channels in output images
            ngf (int)           -- the number of filters in the last conv layer
            norm_layer          -- normalization layer
            use_dropout (bool)  -- if use dropout layers
            n_blocks (int)      -- the number of ResNet blocks
            padding_type (str)  -- the name of padding layer in conv layers: reflect | replicate | zero
        """
        assert(n_blocks >= 0)
        super(ResnetGenerator, self).__init__()
        if type(norm_layer) == functools.partial:
            use_bias = norm_layer.func == nn.InstanceNorm2d
        else:
            use_bias = norm_layer == nn.InstanceNorm2d

        model = [nn.ReflectionPad2d(3),
                 nn.Conv2d(input_nc, ngf, kernel_size=7, padding=0, bias=use_bias),
                 norm_layer(ngf),
                 nn.ReLU(True)]

        n_downsampling = 2
        for i in range(n_downsampling):  # add downsampling layers
            mult = 2 ** i
            model += [nn.Conv2d(ngf * mult, ngf * mult * 2, kernel_size=3, stride=2, padding=1, bias=use_bias),
                      norm_layer(ngf * mult * 2),
                      nn.ReLU(True)]

        mult = 2 ** n_downsampling
        for i in range(n_blocks):       # add ResNet blocks

            model += [ResnetBlock(ngf * mult, padding_type=padding_type, norm_layer=norm_layer, use_dropout=use_dropout, use_bias=use_bias)]

        for i in range(n_downsampling):  # add upsampling layers
            mult = 2 ** (n_downsampling - i)
            model += [nn.Upsample(scale_factor=2,mode='nearest'),
                      nn.Conv2d(ngf * mult, int(ngf * mult / 2),
                                         kernel_size=3, stride=1,
                                         padding=1,
                                         bias=use_bias),
                      norm_layer(int(ngf * mult / 2)),
                      nn.ReLU(True)]
        model += [nn.ReflectionPad2d(3)]
        model += [nn.Conv2d(ngf, output_nc, kernel_size=7, padding=0)]
        model += [nn.Tanh()]

        self.model = nn.Sequential(*model)

    def forward(self, input):
        """Standard forward"""
        return self.model(input)
    

class ResnetBlock(nn.Module):
    """Define a Resnet block"""

    def __init__(self, dim, padding_type, norm_layer, use_dropout, use_bias):
        """Initialize the Resnet block
        A resnet block is a conv block with skip connections
        We construct a conv block with build_conv_block function,
        and implement skip connections in <forward> function.
        Original Resnet paper: https://arxiv.org/pdf/1512.03385.pdf
        """
        super(ResnetBlock, self).__init__()
        self.conv_block = self.build_conv_block(dim, padding_type, norm_layer, use_dropout, use_bias)

    def build_conv_block(self, dim, padding_type, norm_layer, use_dropout, use_bias):
        """Construct a convolutional block.
        Parameters:
            dim (int)           -- the number of channels in the conv layer.
            padding_type (str)  -- the name of padding layer: reflect | replicate | zero
            norm_layer          -- normalization layer
            use_dropout (bool)  -- if use dropout layers.
            use_bias (bool)     -- if the conv layer uses bias or not
        Returns a conv block (with a conv layer, a normalization layer, and a non-linearity layer (ReLU))
        """
        conv_block = []
        p = 0
        if padding_type == 'reflect':
            conv_block += [nn.ReflectionPad2d(1)]
        elif padding_type == 'replicate':
            conv_block += [nn.ReplicationPad2d(1)]
        elif padding_type == 'zero':
            p = 1
        else:
            raise NotImplementedError('padding [%s] is not implemented' % padding_type)

        conv_block += [nn.Conv2d(dim, dim, kernel_size=3, padding=p, bias=use_bias), norm_layer(dim), nn.ReLU(True)]
        if use_dropout:
            conv_block += [nn.Dropout(0.5)]

        p = 0
        if padding_type == 'reflect':
            conv_block += [nn.ReflectionPad2d(1)]
        elif padding_type == 'replicate':
            conv_block += [nn.ReplicationPad2d(1)]
        elif padding_type == 'zero':
            p = 1
        else:
            raise NotImplementedError('padding [%s] is not implemented' % padding_type)
        conv_block += [nn.Conv2d(dim, dim, kernel_size=3, padding=p, bias=use_bias), norm_layer(dim)]

        return nn.Sequential(*conv_block)

    def forward(self, x):
        """Forward function (with skip connections)"""
        out = x + self.conv_block(x)  # add skip connections
        return out
    
if __name__ == '__main__':

    from torchinfo import summary
    device = "cpu"
    
    voxel_size_lr = 10
    voxel_size_hr = 1
    sf = int(voxel_size_lr / voxel_size_hr)
    lr_image_shape = (1, 64, 64)
    hr_image_shape = (lr_image_shape[0], lr_image_shape[1] * sf, lr_image_shape[2] * sf)
    gen_baseFilters = 64
    gen_numResBlocks = 6
    disc_baseFilters = 64
    disc_numInterBlocks = 2 
    
    netG_hr2lr = GeneratorSR(inShape=hr_image_shape, 
                             outShape=lr_image_shape, 
                             baseFilters=gen_baseFilters, 
                             numResBlocks=gen_numResBlocks).to(device)
    
    netG_lr2hr = GeneratorSR(inShape=lr_image_shape, 
                             outShape=hr_image_shape, 
                             baseFilters=gen_baseFilters, 
                             numResBlocks=gen_numResBlocks).to(device)
    
    netD_hr = Discriminator(inShape=hr_image_shape, 
                            baseFilters=disc_baseFilters, 
                            numInterBlocks=disc_numInterBlocks).to(device)
    
    netD_lr = Discriminator(inShape=lr_image_shape,
                            baseFilters=disc_baseFilters, 
                            numInterBlocks=disc_numInterBlocks).to(device)
    
    print(lr_image_shape)
    print(hr_image_shape)
    batch = 2
    image_lr = torch.randn(batch, *lr_image_shape).to(device)
    image_hr = torch.randn(batch, *hr_image_shape).to(device)
    
    
    
    image_lr_gen = netG_hr2lr(image_hr)
    image_hr_gen = netG_lr2hr(image_lr_gen)
    print(image_lr_gen.shape)
    print(image_hr_gen.shape)
    
    netD_hr_out = netD_hr(image_hr_gen)
    netD_lr_out = netD_lr(image_lr_gen)
    print(netD_hr_out.shape)
    print(netD_lr_out.shape)
    
    print(netD_hr_out.shape)
    print(netD_lr_out.shape)
    
    
    # sum = summary(netG_hr2lr, input_size=(batch, *hr_image_shape), device=device)
    sum = summary(netG_lr2hr, input_size=(batch, *lr_image_shape), device=device)
    print(sum)
    
    # sum = summary(netD_hr, input_size=(batch, *hr_image_shape), device=device)
    sum = summary(netD_lr, input_size=(batch, *lr_image_shape), device=device)
    print(sum)
    
    
    
    net_res = ResnetGenerator(input_nc=1, 
                              output_nc=1, 
                              ngf=64, 
                              norm_layer=nn.BatchNorm2d, 
                              use_dropout=False, 
                              n_blocks=5, 
                              padding_type='reflect').to(device)
    
    net_res_out = net_res(image_hr)
    print(net_res_out.shape)
    
    sum = summary(netD_lr, input_size=(batch, *hr_image_shape), device=device)
    print(sum)